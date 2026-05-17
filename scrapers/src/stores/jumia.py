import logging
from playwright.sync_api import Page
from .base import BaseScraper

logger = logging.getLogger(__name__)


class JumiaScraper(BaseScraper):
    store_name = "Jumia"
    store_domain = "jumia.com.eg"

    def _scrape_category(self, page: Page, url: str, selectors: dict) -> list[dict]:
        products = []
        self._navigate_with_retry(page, url)

        container_sel = selectors.get("product_card", "article.prd")
        page.wait_for_selector(container_sel, timeout=15000)

        cards = page.query_selector_all(container_sel)
        logger.info(f"Jumia: Found {len(cards)} product cards")

        for card in cards:
            try:
                title_el = card.query_selector(selectors.get("title", ".name"))
                title = title_el.inner_text().strip() if title_el else None
                if not title:
                    continue

                link_el = card.query_selector(selectors.get("link", "a.core"))
                link = link_el.get_attribute("href") if link_el else ""
                if link and not link.startswith("http"):
                    link = f"https://www.jumia.com.eg{link}"

                sku = card.get_attribute("data-sku") or (link.rsplit("-", 1)[-1].split(".")[0] if link else None)

                price_el = card.query_selector(selectors.get("price", ".prc"))
                price = None
                if price_el:
                    import re
                    nums = re.findall(r"[\d,]+\.?\d*", price_el.inner_text().replace(",", ""))
                    if nums:
                        try:
                            price = float(nums[0])
                        except ValueError:
                            pass

                old_price_el = card.query_selector(selectors.get("old_price", ".old"))
                old_price = None
                if old_price_el:
                    import re
                    nums = re.findall(r"[\d,]+\.?\d*", old_price_el.inner_text().replace(",", ""))
                    if nums:
                        try:
                            old_price = float(nums[0])
                        except ValueError:
                            pass

                discount_el = card.query_selector(selectors.get("discount", ".bdg._dsct"))

                rating_el = card.query_selector(selectors.get("rating", ".stars._s"))
                rating = None
                if rating_el:
                    import re
                    style = rating_el.get_attribute("style") or ""
                    match = re.search(r"width:\s*([\d.]+)%", style)
                    if match:
                        rating = round(float(match.group(1)) / 20, 1)

                review_el = card.query_selector(selectors.get("review_count", ".rev"))
                review_count = None
                if review_el:
                    import re
                    match = re.search(r"(\d+)", review_el.inner_text())
                    if match:
                        review_count = int(match.group(1))

                img_el = card.query_selector(selectors.get("image", "img.img"))
                image_url = img_el.get_attribute("data-src") or img_el.get_attribute("src") if img_el else None

                products.append({
                    "title": title,
                    "url": link,
                    "external_id": sku,
                    "price": old_price if old_price else price,
                    "sale_price": price if old_price and old_price > (price or 0) else None,
                    "rating": rating,
                    "review_count": review_count,
                    "image_url": image_url,
                    "in_stock": True,
                })

            except Exception as e:
                logger.warning(f"Error parsing Jumia card: {e}")
                continue

        logger.info(f"Jumia: Scraped {len(products)} products")
        return products
