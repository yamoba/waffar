from .amazon_eg import AmazonEgScraper
from .noon import NoonScraper
from .jumia import JumiaScraper
from .btech import BtechScraper
from .base import BaseScraper

STORE_SCRAPERS: dict[str, type[BaseScraper]] = {
    "amazon-eg": AmazonEgScraper,
    "noon": NoonScraper,
    "jumia": JumiaScraper,
    "btech": BtechScraper,
}


def get_scraper_for_store(store_slug: str) -> BaseScraper | None:
    scraper_class = STORE_SCRAPERS.get(store_slug)
    if scraper_class:
        return scraper_class()
    return None
