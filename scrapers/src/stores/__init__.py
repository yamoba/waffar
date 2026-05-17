from .amazon_eg import AmazonEgScraper
from .noon import NoonScraper
from .jumia import JumiaScraper
from .btech import BtechScraper
from .base import BaseScraper
from ._placeholder import make_placeholder

# Real, verified adapters.
_REAL: dict[str, type[BaseScraper]] = {
    "amazon-eg": AmazonEgScraper,
    "noon": NoonScraper,
    "jumia": JumiaScraper,
    "btech": BtechScraper,
}

# Registered Egyptian retailers awaiting verified selectors. Listed by slug so that
# admin/seed code can reference them today; orchestrator will skip-with-warning until
# a real adapter is wired in. Each entry: (slug, display_name, domain).
_PENDING = [
    ("carrefour-eg", "Carrefour Egypt", "carrefouregypt.com"),
    ("raya-shop", "Raya Shop", "rayashop.com"),
    ("2b-egypt", "2B Egypt", "2b.com.eg"),
    ("dream2000", "Dream 2000", "dream2000.com"),
    ("spinneys-eg", "Spinneys Egypt", "spinneys-egypt.com"),
    ("hyperone", "HyperOne", "hyperone.com.eg"),
    ("eldokan", "Eldokan", "eldokan.com"),
    ("mobile-shop", "Mobile Shop", "mobileshop.com.eg"),
    ("sigma-computer", "Sigma Computer", "sigma-computer.com"),
    ("compumarts", "Compumarts", "compumarts.com"),
    ("radioshack-eg", "RadioShack Egypt", "radioshackegypt.com"),
    ("elaraby-group", "El Araby Group", "elarabygroup.com"),
]

STORE_SCRAPERS: dict[str, type[BaseScraper]] = dict(_REAL)
for slug, name, domain in _PENDING:
    STORE_SCRAPERS[slug] = make_placeholder(name, domain)


def get_scraper_for_store(store_slug: str) -> BaseScraper | None:
    scraper_class = STORE_SCRAPERS.get(store_slug)
    if scraper_class:
        return scraper_class()
    return None


def list_registered_stores() -> list[dict]:
    """Used by admin/health endpoints to enumerate adapter coverage."""
    out = []
    for slug, cls in STORE_SCRAPERS.items():
        out.append({
            "slug": slug,
            "name": cls.store_name,
            "domain": cls.store_domain,
            "implemented": not getattr(cls, "placeholder", False),
        })
    return out
