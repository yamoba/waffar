import time
import logging
import json
from datetime import datetime, timezone
from ..db import execute_query, fetch_one
from ..stores import get_scraper_for_store
from .normalizer import normalize_product_data
from .deduplicator import find_or_create_product

logger = logging.getLogger(__name__)


def run_store_scrape(config: dict) -> dict:
    start = time.time()
    store_slug = config["store_slug"]
    selectors = config["selectors"] if isinstance(config["selectors"], dict) else json.loads(config["selectors"])

    scraper = get_scraper_for_store(store_slug)
    if not scraper:
        raise ValueError(f"No scraper registered for store: {store_slug}")

    products_found = 0
    prices_updated = 0
    errors = 0
    error_log_parts = []

    try:
        raw_products = scraper.scrape(config["category_url"], selectors)
    except Exception as e:
        logger.error(f"Scraper failed for {store_slug}: {e}")
        return {
            "products_found": 0,
            "prices_updated": 0,
            "errors": 1,
            "error_log": str(e),
            "duration_ms": int((time.time() - start) * 1000),
        }

    for raw in raw_products:
        try:
            normalized = normalize_product_data(raw, store_slug)
            product_id = find_or_create_product(normalized)
            products_found += 1

            listing = fetch_one(
                """
                SELECT id, price, sale_price FROM "Listing"
                WHERE product_id = :pid AND store_id = :sid
                LIMIT 1
                """,
                {"pid": product_id, "sid": config["store_id"]},
            )

            price = normalized["price"]
            sale_price = normalized.get("sale_price")

            if listing:
                old_price = listing["sale_price"] or listing["price"]
                new_price = sale_price or price

                execute_query(
                    """
                    UPDATE "Listing" SET
                        price = :price,
                        sale_price = :sale_price,
                        in_stock = :in_stock,
                        shipping_cost = :shipping_cost,
                        free_shipping = :free_shipping,
                        rating = :rating,
                        review_count = :review_count,
                        last_scraped_at = NOW(),
                        updated_at = NOW()
                    WHERE id = :id
                    """,
                    {
                        "id": listing["id"],
                        "price": price,
                        "sale_price": sale_price,
                        "in_stock": normalized.get("in_stock", True),
                        "shipping_cost": normalized.get("shipping_cost"),
                        "free_shipping": normalized.get("free_shipping", False),
                        "rating": normalized.get("rating"),
                        "review_count": normalized.get("review_count"),
                    },
                )

                if old_price != new_price:
                    execute_query(
                        """
                        INSERT INTO "PriceHistory" (id, product_id, listing_id, price, sale_price, in_stock, timestamp)
                        VALUES (gen_random_uuid(), :pid, :lid, :price, :sale_price, :in_stock, NOW())
                        """,
                        {
                            "pid": product_id,
                            "lid": listing["id"],
                            "price": price,
                            "sale_price": sale_price,
                            "in_stock": normalized.get("in_stock", True),
                        },
                    )
                    prices_updated += 1
            else:
                listing_id = execute_query(
                    """
                    INSERT INTO "Listing" (
                        id, product_id, store_id, external_url, external_id,
                        price, sale_price, in_stock, shipping_cost, free_shipping,
                        shipping_days, return_days, installment_plan, warranty,
                        rating, review_count, condition, last_scraped_at
                    ) VALUES (
                        gen_random_uuid(), :pid, :sid, :url, :eid,
                        :price, :sale_price, :in_stock, :shipping_cost, :free_shipping,
                        :shipping_days, :return_days, :installment::jsonb, :warranty,
                        :rating, :review_count, 'NEW', NOW()
                    ) RETURNING id
                    """,
                    {
                        "pid": product_id,
                        "sid": config["store_id"],
                        "url": normalized.get("url", ""),
                        "eid": normalized.get("external_id"),
                        "price": price,
                        "sale_price": sale_price,
                        "in_stock": normalized.get("in_stock", True),
                        "shipping_cost": normalized.get("shipping_cost"),
                        "free_shipping": normalized.get("free_shipping", False),
                        "shipping_days": normalized.get("shipping_days"),
                        "return_days": normalized.get("return_days"),
                        "installment": json.dumps(normalized.get("installment")) if normalized.get("installment") else None,
                        "warranty": normalized.get("warranty"),
                        "rating": normalized.get("rating"),
                        "review_count": normalized.get("review_count"),
                    },
                ).fetchone()[0]

                execute_query(
                    """
                    INSERT INTO "PriceHistory" (id, product_id, listing_id, price, sale_price, in_stock, timestamp)
                    VALUES (gen_random_uuid(), :pid, :lid, :price, :sale_price, :in_stock, NOW())
                    """,
                    {
                        "pid": product_id,
                        "lid": listing_id,
                        "price": price,
                        "sale_price": sale_price,
                        "in_stock": normalized.get("in_stock", True),
                    },
                )
                prices_updated += 1

        except Exception as e:
            errors += 1
            error_log_parts.append(f"{normalized.get('title', 'unknown')}: {str(e)[:200]}")
            logger.error(f"Error processing product: {e}")

    duration_ms = int((time.time() - start) * 1000)

    return {
        "products_found": products_found,
        "prices_updated": prices_updated,
        "errors": errors,
        "error_log": "\n".join(error_log_parts[:20]) if error_log_parts else None,
        "duration_ms": duration_ms,
    }
