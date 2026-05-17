"""Validation pipeline — every scraped product passes through here before persistence."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from ..db import fetch_one
from ..stores.base import BaseScraper

logger = logging.getLogger(__name__)

# Tunables. Prices are stored as integer-cents (price * 100) in DB, but the scraper
# normalizes to that representation only inside the orchestrator — validators below
# operate on the *raw* float price coming out of an adapter, BEFORE normalization,
# unless explicitly noted.

MIN_REASONABLE_PRICE_EGP = 5.0       # Anything cheaper than 5 EGP is almost certainly a parsing error.
MAX_REASONABLE_PRICE_EGP = 5_000_000.0  # 5M EGP ceiling — rejects parsed bytes/IDs masquerading as prices.

# Price-anomaly thresholds for confidence scoring. Compared against the last known
# Listing.price (stored in *cents* in DB; converted to EGP before compare).
SUSPICIOUS_DROP_RATIO = 0.5     # New price < 50% of previous → flag SUSPICIOUS.
SUSPICIOUS_JUMP_RATIO = 3.0     # New price > 3x previous → flag SUSPICIOUS.


@dataclass
class ValidationResult:
    ok: bool
    reason: str | None = None
    confidence: float = 1.0
    suspicious: bool = False  # If True, persist but mark verificationStatus=SUSPICIOUS.


def validate_raw_product(raw: dict) -> ValidationResult:
    """Stage 1 — structural validation of a raw scraped row. Rejects junk before normalization."""
    title = (raw.get("title") or "").strip()
    if not title or len(title) < 3:
        return ValidationResult(False, "missing_title")

    url = (raw.get("url") or "").strip()
    if not url or not url.startswith("http"):
        return ValidationResult(False, "invalid_url")

    # Reject obvious category-page links pretending to be product pages.
    lowered = url.lower()
    if any(seg in lowered for seg in ("/c/", "/category/", "/cat/", "/search?", "/s?")):
        return ValidationResult(False, "category_page_not_product")

    price = raw.get("price")
    if price is None:
        return ValidationResult(False, "missing_price")
    try:
        price_f = float(price)
    except (TypeError, ValueError):
        return ValidationResult(False, "unparseable_price")
    if price_f < MIN_REASONABLE_PRICE_EGP or price_f > MAX_REASONABLE_PRICE_EGP:
        return ValidationResult(False, f"price_out_of_range:{price_f}")

    if not raw.get("image_url"):
        # Image-less listings are usually placeholders or admin pages; require one.
        return ValidationResult(False, "missing_image")

    if not (raw.get("external_id") or raw.get("asin") or raw.get("sku")):
        # Without a stable external ID we can't dedupe or refresh later. Reject.
        return ValidationResult(False, "missing_external_id")

    return ValidationResult(True)


def score_price_confidence(
    product_id: str | None,
    store_id: str,
    new_price_egp: float,
) -> tuple[float, bool, str | None]:
    """Stage 2 — confidence scoring vs. historical prices.

    Returns (confidence in [0,1], suspicious flag, reason).
    """
    if not product_id:
        return 0.7, False, "no_history"  # New product, no baseline.

    row = fetch_one(
        """
        SELECT price, sale_price, last_verified_at
        FROM "Listing"
        WHERE product_id = :pid AND store_id = :sid
        LIMIT 1
        """,
        {"pid": product_id, "sid": store_id},
    )
    if not row or row.get("price") is None:
        return 0.7, False, "no_history"

    prev_egp = (row.get("sale_price") or row["price"]) / 100.0
    if prev_egp <= 0:
        return 0.7, False, "no_history"

    ratio = new_price_egp / prev_egp
    if ratio <= SUSPICIOUS_DROP_RATIO:
        return 0.3, True, f"unrealistic_drop:{ratio:.2f}"
    if ratio >= SUSPICIOUS_JUMP_RATIO:
        return 0.3, True, f"unrealistic_jump:{ratio:.2f}"

    # Small moves are perfectly normal.
    if 0.85 <= ratio <= 1.15:
        return 1.0, False, None
    return 0.85, False, "moderate_change"


def interpret_url_health(check: dict) -> tuple[str, bool]:
    """Map the dict returned by BaseScraper.http_validate_url to a (status, is_dead) pair.

    status is one of: VERIFIED, SUSPICIOUS, DEAD, STALE.
    is_dead means the listing should be hidden/deactivated now.
    """
    if check.get("ok"):
        if check.get("looks_like_product"):
            return "VERIFIED", False
        return "SUSPICIOUS", False
    reason = check.get("reason")
    if reason in ("not_found",):
        return "DEAD", True
    if reason in ("blocked",):
        # We can't conclude; leave existing status alone — mark STALE so it gets revisited.
        return "STALE", False
    if reason in ("empty_body", "anti_bot_interstitial", "http_4xx_5xx"):
        return "SUSPICIOUS", False
    return "STALE", False


def check_listing_url(url: str) -> tuple[str, bool, dict]:
    """Convenience wrapper used by the background verification task."""
    result = BaseScraper.http_validate_url(url)
    status, is_dead = interpret_url_health(result)
    return status, is_dead, result
