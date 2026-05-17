"""Placeholder adapters — registered stores whose real selectors haven't been verified yet.

Why this exists instead of guessed selectors: a scraper that runs against a real site with
made-up selectors produces silently-wrong data (the worst failure mode for a price-comparison
platform). Registering the store as a placeholder means:

  • the store shows up in admin / store registry,
  • the orchestrator notices it's a placeholder and skips it cleanly,
  • the admin scraper-health endpoint can report which stores still need real adapters.

To activate a placeholder: subclass BaseScraper directly (see noon.py / amazon_eg.py),
verify selectors against a real category page, then swap the entry in STORE_SCRAPERS.
"""

from playwright.sync_api import Page
from .base import BaseScraper


def make_placeholder(name: str, domain: str) -> type[BaseScraper]:
    cls = type(
        f"{name.replace('.', '').replace(' ', '')}PlaceholderScraper",
        (BaseScraper,),
        {
            "store_name": name,
            "store_domain": domain,
            "placeholder": True,
            "_scrape_category": lambda self, page, url, selectors: [],
        },
    )
    return cls
