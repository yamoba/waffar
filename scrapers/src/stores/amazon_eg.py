import logging
from playwright.sync_api import Page
from .base import BaseScraper

logger = logging.getLogger(__name__)


class AmazonEgScraper(BaseScraper):
    store_name = "Amazon.eg"
    store_domain = "amazon.eg"

    def _scrape_category(self, page: Page, url: str, selectors: dict) -> list[dict]:
        products = []
        self._navigate_with_retry(page, url)
        page.wait_for_selector(selectors.get("product_card", '[data-component-type="s-search-result"]'), timeout=15000)

        cards = page.query_selector_all(selectors.get("product_card", '[data-component-type="s-search-result"]'))
        logger.info(f"Amazon.eg: Found {len(cards)} product cards")

        for card in cards:
            try:
                asin = card.get_attribute("data-asin")
                if not asin:
                    continue

                title_el = card.query_selector(selectors.get("title", "h2 a span"))
                title = title_el.inner_text().strip() if title_el else None
                if not title:
                    continue

                link_el = card.query_selector(selectors.get("link", "h2 a"))
                link = f"https://www.amazon.eg{link_el.get_attribute('href')}" if link_el else ""

                price_whole = card.query_selector(selectors.get("price_whole", ".a-price-whole"))
                price_fraction = card.query_selector(selectors.get("price_fraction", ".a-price-fraction"))
                price = None
                if price_whole:
                    whole = price_whole.inner_text().replace(",", "").replace(".", "").strip()
                    fraction = price_fraction.inner_text().strip() if price_fraction else "00"
                    try:
                        price = float(f"{whole}.{fraction}")
                    except ValueError:
                        pass

                original_el = card.query_selector(selectors.get("original_price", ".a-text-price .a-offscreen"))
                original_price = None
                if original_el:
                    import re
                    text = original_el.inner_text().replace(",", "")
                    nums = re.findall(r"[\d.]+", text)
                    if nums:
                        try:
                            original_price = float(nums[0])
                        except ValueError:
                            pass

                rating_el = card.query_selector(selectors.get("rating", ".a-icon-star-small .a-icon-alt"))
                rating = None
                if rating_el:
                    import re
                    match = re.search(r"([\d.]+)", rating_el.inner_text())
                    if match:
                        rating = float(match.group(1))

                review_el = card.query_selector(selectors.get("review_count", '[aria-label*="ratings"]'))
                review_count = None
                if review_el:
                    import re
                    text = review_el.inner_text().replace(",", "")
                    match = re.search(r"(\d+)", text)
                    if match:
                        review_count = int(match.group(1))

                img_el = card.query_selector(selectors.get("image", ".s-image"))
                image_url = img_el.get_attribute("src") if img_el else None

                shipping_el = card.query_selector(selectors.get("shipping", ".a-row.a-size-base.a-color-secondary"))
                free_shipping = False
                if shipping_el:
                    shipping_text = shipping_el.inner_text().lower()
                    free_shipping = "free" in shipping_text or "مجان" in shipping_text

                products.append({
                    "title": title,
                    "url": link,
                    "external_id": asin,
                    "asin": asin,
                    "price": price,
                    "sale_price": price if original_price and original_price > price else None,
                    "original_price": original_price,
                    "rating": rating,
                    "review_count": review_count,
                    "image_url": image_url,
                    "free_shipping": free_shipping,
                    "in_stock": True,
                })

            except Exception as e:
                logger.warning(f"Error parsing Amazon card: {e}")
                continue

        # Pagination — scrape up to 3 pages
        for page_num in range(2, 4):
            next_btn = page.query_selector(selectors.get("next_page", ".s-pagination-next:not(.s-pagination-disabled)"))
            if not next_btn:
                break

            next_btn.click()
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(2000)

            cards = page.query_selector_all(selectors.get("product_card", '[data-component-type="s-search-result"]'))
            for card in cards:
                try:
                    asin = card.get_attribute("data-asin")
                    if not asin:
                        continue
                    title_el = card.query_selector("h2 a span")
                    if not title_el:
                        continue

                    price_whole = card.query_selector(".a-price-whole")
                    price = None
                    if price_whole:
                        try:
                            price = float(price_whole.inner_text().replace(",", "").replace(".", "").strip())
                        except ValueError:
                            pass

                    products.append({
                        "title": title_el.inner_text().strip(),
                        "url": f"https://www.amazon.eg{card.query_selector('h2 a').get_attribute('href')}",
                        "external_id": asin,
                        "price": price,
                        "in_stock": True,
                    })
                except Exception:
                    continue

        logger.info(f"Amazon.eg: Scraped {len(products)} products total")
        return products
