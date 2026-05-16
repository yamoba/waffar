import logging
from playwright.sync_api import Page
from .base import BaseScraper

logger = logging.getLogger(__name__)


class NoonScraper(BaseScraper):
    store_name = "Noon"
    store_domain = "noon.com"

    def _scrape_category(self, page: Page, url: str, selectors: dict) -> list[dict]:
        products = []
        self._navigate_with_retry(page, url)

        container_sel = selectors.get("product_card", '[data-qa="product-item"]')
        page.wait_for_selector(container_sel, timeout=15000)

        cards = page.query_selector_all(container_sel)
        logger.info(f"Noon: Found {len(cards)} product cards")

        for card in cards:
            try:
                title_el = card.query_selector(selectors.get("title", '[data-qa="product-name"]'))
                title = title_el.inner_text().strip() if title_el else None
                if not title:
                    continue

                link_el = card.query_selector("a")
                link = link_el.get_attribute("href") if link_el else ""
                if link and not link.startswith("http"):
                    link = f"https://www.noon.com{link}"

                sku = link.split("/")[-1].split("?")[0] if link else None

                price_el = card.query_selector(selectors.get("price", '[data-qa="product-price"]'))
                price = None
                if price_el:
                    import re
                    nums = re.findall(r"[\d,]+\.?\d*", price_el.inner_text().replace(",", ""))
                    if nums:
                        try:
                            price = float(nums[0])
                        except ValueError:
                            pass

                old_price_el = card.query_selector(selectors.get("old_price", '[data-qa="product-old-price"]'))
                old_price = None
                if old_price_el:
                    import re
                    nums = re.findall(r"[\d,]+\.?\d*", old_price_el.inner_text().replace(",", ""))
                    if nums:
                        try:
                            old_price = float(nums[0])
                        except ValueError:
                            pass

                rating_el = card.query_selector(selectors.get("rating", '[data-qa="product-rating"]'))
                rating = None
                if rating_el:
                    import re
                    match = re.search(r"([\d.]+)", rating_el.inner_text())
                    if match:
                        rating = float(match.group(1))

                img_el = card.query_selector(selectors.get("image", "img"))
                image_url = img_el.get_attribute("src") if img_el else None

                express_el = card.query_selector(selectors.get("express", '[data-qa="product-express"]'))

                products.append({
                    "title": title,
                    "url": link,
                    "external_id": sku,
                    "price": old_price if old_price and old_price > (price or 0) else price,
                    "sale_price": price if old_price and old_price > (price or 0) else None,
                    "rating": rating,
                    "image_url": image_url,
                    "free_shipping": express_el is not None,
                    "in_stock": True,
                })

            except Exception as e:
                logger.warning(f"Error parsing Noon card: {e}")
                continue

        logger.info(f"Noon: Scraped {len(products)} products")
        return products
