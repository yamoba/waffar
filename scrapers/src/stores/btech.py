import logging
from playwright.sync_api import Page
from .base import BaseScraper

logger = logging.getLogger(__name__)


class BtechScraper(BaseScraper):
    store_name = "B.Tech"
    store_domain = "btech.com"

    def _scrape_category(self, page: Page, url: str, selectors: dict) -> list[dict]:
        products = []
        self._navigate_with_retry(page, url)

        container_sel = selectors.get("product_card", ".product-item")
        page.wait_for_selector(container_sel, timeout=15000)

        cards = page.query_selector_all(container_sel)
        logger.info(f"B.Tech: Found {len(cards)} product cards")

        for card in cards:
            try:
                title_el = card.query_selector(selectors.get("title", ".product-item-link"))
                title = title_el.inner_text().strip() if title_el else None
                if not title:
                    continue

                link_el = card.query_selector(selectors.get("link", "a.product-item-link"))
                link = link_el.get_attribute("href") if link_el else ""

                price_el = card.query_selector(selectors.get("price", ".price"))
                price = None
                if price_el:
                    import re
                    nums = re.findall(r"[\d,]+\.?\d*", price_el.inner_text().replace(",", ""))
                    if nums:
                        try:
                            price = float(nums[0])
                        except ValueError:
                            pass

                old_price_el = card.query_selector(selectors.get("old_price", ".old-price .price"))
                old_price = None
                if old_price_el:
                    import re
                    nums = re.findall(r"[\d,]+\.?\d*", old_price_el.inner_text().replace(",", ""))
                    if nums:
                        try:
                            old_price = float(nums[0])
                        except ValueError:
                            pass

                img_el = card.query_selector(selectors.get("image", ".product-image-photo"))
                image_url = img_el.get_attribute("src") if img_el else None

                installment_el = card.query_selector(selectors.get("installment", ".installment-text"))
                installment = None
                if installment_el:
                    import re
                    text = installment_el.inner_text()
                    match = re.search(r"(\d+)\s*(?:months|شهر)", text, re.IGNORECASE)
                    if match and price:
                        months = int(match.group(1))
                        installment = {
                            "months": months,
                            "monthlyAmount": int((old_price or price) / months * 100),
                            "bank": "Multiple Banks",
                        }

                products.append({
                    "title": title,
                    "url": link,
                    "price": old_price if old_price else price,
                    "sale_price": price if old_price and old_price > (price or 0) else None,
                    "image_url": image_url,
                    "installment": installment,
                    "in_stock": True,
                    "free_shipping": True,
                    "return_days": 14,
                    "warranty": "1 year manufacturer warranty",
                })

            except Exception as e:
                logger.warning(f"Error parsing B.Tech card: {e}")
                continue

        logger.info(f"B.Tech: Scraped {len(products)} products")
        return products
