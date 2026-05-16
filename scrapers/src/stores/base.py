import logging
from abc import ABC, abstractmethod
from playwright.sync_api import sync_playwright, Page, Browser
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential
from ..config import SCRAPER_TIMEOUT, PROXY_URL

logger = logging.getLogger(__name__)
ua = UserAgent()


class BaseScraper(ABC):
    store_name: str = ""
    store_domain: str = ""

    def scrape(self, category_url: str, selectors: dict) -> list[dict]:
        with sync_playwright() as p:
            browser_args = {
                "headless": True,
                "args": ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            }
            if PROXY_URL:
                browser_args["proxy"] = {"server": PROXY_URL}

            browser = p.chromium.launch(**browser_args)
            context = browser.new_context(
                user_agent=ua.random,
                viewport={"width": 1920, "height": 1080},
                locale="ar-EG",
            )
            context.set_default_timeout(SCRAPER_TIMEOUT)

            try:
                page = context.new_page()
                products = self._scrape_category(page, category_url, selectors)
                return products
            except Exception as e:
                logger.error(f"Scrape error on {self.store_name}: {e}")
                raise
            finally:
                browser.close()

    @abstractmethod
    def _scrape_category(self, page: Page, url: str, selectors: dict) -> list[dict]:
        pass

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _navigate_with_retry(self, page: Page, url: str):
        page.goto(url, wait_until="domcontentloaded")

    def _extract_text(self, page: Page, selector: str, default: str = "") -> str:
        try:
            el = page.query_selector(selector)
            return el.inner_text().strip() if el else default
        except Exception:
            return default

    def _extract_attr(self, page: Page, selector: str, attr: str, default: str = "") -> str:
        try:
            el = page.query_selector(selector)
            return el.get_attribute(attr) or default if el else default
        except Exception:
            return default

    def _extract_price(self, page: Page, selector: str) -> float | None:
        text = self._extract_text(page, selector)
        if not text:
            return None
        import re
        nums = re.findall(r"[\d,]+\.?\d*", text.replace(",", ""))
        if nums:
            try:
                return float(nums[0])
            except ValueError:
                return None
        return None
