import logging
import random
import re
from abc import ABC, abstractmethod
from typing import Any
import httpx
from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeoutError
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from ..config import SCRAPER_TIMEOUT, PROXY_URL

logger = logging.getLogger(__name__)
ua = UserAgent()

# Markers that strongly suggest an anti-bot / interstitial page rather than a real product/category page.
ANTI_BOT_MARKERS = (
    "captcha",
    "are you a human",
    "verify you are human",
    "access denied",
    "cf-browser-verification",
    "challenge-platform",
    "px-captcha",
    "blocked",
)

# Markers that suggest a real product page (used by url_health validator too).
PRODUCT_PAGE_MARKERS = (
    "add to cart",
    "أضف إلى",
    "أضف للسلة",
    "buy now",
    "اشتري الآن",
    "in stock",
    "out of stock",
    'itemprop="price"',
    'property="product:price',
    '"@type":"product"',
)

ACCEPT_LANGUAGE_POOL = ["ar-EG,ar;q=0.9,en;q=0.7", "en-US,en;q=0.9,ar;q=0.6"]


class ScraperDegraded(Exception):
    """Raised when a scraper detects its selectors no longer match the page structure."""


class AntiBotBlocked(Exception):
    """Raised when the page returns a CAPTCHA / bot-protection interstitial."""


class BaseScraper(ABC):
    store_name: str = ""
    store_domain: str = ""
    # When True, the scraper engine should not actually run this adapter (registered placeholder).
    placeholder: bool = False

    def scrape(self, category_url: str, selectors: dict) -> list[dict]:
        with sync_playwright() as p:
            browser_args: dict[str, Any] = {
                "headless": True,
                "args": [
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                ],
            }
            if PROXY_URL:
                browser_args["proxy"] = {"server": PROXY_URL}

            browser = p.chromium.launch(**browser_args)
            context = browser.new_context(
                user_agent=self._random_ua(),
                viewport={"width": 1920, "height": 1080},
                locale="ar-EG",
                extra_http_headers={
                    "Accept-Language": random.choice(ACCEPT_LANGUAGE_POOL),
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                },
            )
            context.set_default_timeout(SCRAPER_TIMEOUT)

            try:
                page = context.new_page()
                self._navigate_with_retry(page, category_url)
                self._assert_not_blocked(page)
                products = self._scrape_category(page, category_url, selectors)
                if not products:
                    # Selectors matched zero cards: very likely a redesign / degradation, not an empty page.
                    raise ScraperDegraded(
                        f"{self.store_name}: zero products extracted — possible selector drift on {category_url}"
                    )
                return products
            finally:
                browser.close()

    @abstractmethod
    def _scrape_category(self, page: Page, url: str, selectors: dict) -> list[dict]:
        ...

    # ─── Navigation / anti-bot helpers ─────────────────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((PlaywrightTimeoutError, AntiBotBlocked)),
        reraise=True,
    )
    def _navigate_with_retry(self, page: Page, url: str) -> None:
        response = page.goto(url, wait_until="domcontentloaded")
        if response is None:
            raise PlaywrightTimeoutError(f"No response from {url}")
        status = response.status
        if status in (403, 429):
            raise AntiBotBlocked(f"{self.store_name}: HTTP {status} on {url}")
        if status >= 500:
            raise PlaywrightTimeoutError(f"{self.store_name}: upstream HTTP {status} on {url}")

    def _assert_not_blocked(self, page: Page) -> None:
        try:
            title = (page.title() or "").lower()
            body_sample = page.evaluate(
                "() => (document.body && document.body.innerText || '').slice(0, 4000).toLowerCase()"
            )
        except Exception:
            return
        haystack = f"{title}\n{body_sample}"
        for marker in ANTI_BOT_MARKERS:
            if marker in haystack:
                raise AntiBotBlocked(f"{self.store_name}: anti-bot marker '{marker}' detected")

    # ─── Extraction helpers with fallback selectors ────────────────────

    def _first_text(self, root, candidates: list[str], default: str = "") -> str:
        for sel in candidates:
            if not sel:
                continue
            try:
                el = root.query_selector(sel)
                if el:
                    txt = el.inner_text().strip()
                    if txt:
                        return txt
            except Exception:
                continue
        return default

    def _first_attr(self, root, candidates: list[str], attr: str, default: str = "") -> str:
        for sel in candidates:
            if not sel:
                continue
            try:
                el = root.query_selector(sel)
                if el:
                    val = el.get_attribute(attr)
                    if val:
                        return val
            except Exception:
                continue
        return default

    def _parse_price(self, text: str | None) -> float | None:
        if not text:
            return None
        cleaned = text.replace(",", "").replace("٬", "").replace("٫", ".")
        nums = re.findall(r"\d+\.?\d*", cleaned)
        if not nums:
            return None
        try:
            return float(nums[0])
        except ValueError:
            return None

    def _random_ua(self) -> str:
        try:
            return ua.random
        except Exception:
            return (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )

    # ─── HTTP-only URL validation used by the link health checker ──────

    @classmethod
    def http_validate_url(cls, url: str, timeout_s: float = 8.0) -> dict:
        """Lightweight URL health check without booting a browser.

        Returns a dict with keys: ok (bool), status (int|None), reason (str|None),
        final_url (str|None), looks_like_product (bool).
        """
        headers = {
            "User-Agent": ua.random if hasattr(ua, "random") else "Mozilla/5.0",
            "Accept-Language": random.choice(ACCEPT_LANGUAGE_POOL),
            "Accept": "text/html,*/*;q=0.8",
        }
        try:
            with httpx.Client(follow_redirects=True, timeout=timeout_s, headers=headers) as client:
                resp = client.get(url)
        except httpx.TimeoutException:
            return {"ok": False, "status": None, "reason": "timeout", "final_url": None, "looks_like_product": False}
        except httpx.HTTPError as e:
            return {"ok": False, "status": None, "reason": f"http_error:{type(e).__name__}", "final_url": None, "looks_like_product": False}

        if resp.status_code == 404:
            return {"ok": False, "status": 404, "reason": "not_found", "final_url": str(resp.url), "looks_like_product": False}
        if resp.status_code in (403, 429):
            # Cannot conclude — likely bot block, not a real death. Caller should treat as "unknown".
            return {"ok": False, "status": resp.status_code, "reason": "blocked", "final_url": str(resp.url), "looks_like_product": False}
        if resp.status_code >= 400:
            return {"ok": False, "status": resp.status_code, "reason": "http_4xx_5xx", "final_url": str(resp.url), "looks_like_product": False}

        body = (resp.text or "").lower()
        if not body or len(body) < 500:
            return {"ok": False, "status": resp.status_code, "reason": "empty_body", "final_url": str(resp.url), "looks_like_product": False}

        for marker in ANTI_BOT_MARKERS:
            if marker in body:
                return {"ok": False, "status": resp.status_code, "reason": "anti_bot_interstitial", "final_url": str(resp.url), "looks_like_product": False}

        looks_like_product = any(m in body for m in PRODUCT_PAGE_MARKERS)
        return {
            "ok": True,
            "status": resp.status_code,
            "reason": None,
            "final_url": str(resp.url),
            "looks_like_product": looks_like_product,
        }
