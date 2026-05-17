import logging
from datetime import datetime, timezone
from .celery_app import app
from .db import fetch_all, fetch_one, execute_query
from .pipeline.orchestrator import run_store_scrape
from .pipeline.normalizer import normalize_product_data
from .pipeline.validators import check_listing_url

# How long a price can sit before it must be refreshed (per store frequency tier).
FRESHNESS_HOURS_BY_FREQUENCY = {
    "HOT": 1,
    "MEDIUM": 6,
    "DAILY": 12,
    "WEEKLY": 48,
}

# Default revalidation batch size — keep small so a stuck worker doesn't hog the queue.
HEALTH_CHECK_BATCH = 50

logger = logging.getLogger(__name__)


@app.task(name="src.tasks.scrape_all_stores")
def scrape_all_stores(frequency: str = "DAILY"):
    configs = fetch_all(
        """
        SELECT sc.id, sc.store_id, sc.category_url, sc.selectors, sc.frequency,
               s.name as store_name, s.slug as store_slug, s.domain
        FROM "ScraperConfig" sc
        JOIN "Store" s ON sc.store_id = s.id
        WHERE sc.is_active = true AND sc.frequency = :frequency AND s.is_active = true
        """,
        {"frequency": frequency},
    )

    logger.info(f"Starting {frequency} scrape for {len(configs)} configs")

    for config in configs:
        scrape_store.delay(config["id"])

    return {"scheduled": len(configs), "frequency": frequency}


@app.task(name="src.tasks.scrape_store", bind=True, max_retries=3, default_retry_delay=60)
def scrape_store(self, config_id: str):
    config = fetch_one(
        """
        SELECT sc.*, s.name as store_name, s.slug as store_slug, s.domain
        FROM "ScraperConfig" sc
        JOIN "Store" s ON sc.store_id = s.id
        WHERE sc.id = :id
        """,
        {"id": config_id},
    )

    if not config:
        logger.error(f"Config {config_id} not found")
        return

    # Create scraper run record
    run_id = execute_query(
        """
        INSERT INTO "ScraperRun" (id, store_id, status, started_at)
        VALUES (gen_random_uuid(), :store_id, 'RUNNING', NOW())
        RETURNING id
        """,
        {"store_id": config["store_id"]},
    ).fetchone()[0]

    try:
        result = run_store_scrape(config)

        execute_query(
            """
            UPDATE "ScraperRun" SET
                status = :status,
                products_found = :products_found,
                prices_updated = :prices_updated,
                errors = :errors,
                error_log = :error_log,
                duration = :duration,
                completed_at = NOW()
            WHERE id = :id
            """,
            {
                "id": run_id,
                "status": "SUCCESS" if result["errors"] == 0 else "PARTIAL",
                "products_found": result["products_found"],
                "prices_updated": result["prices_updated"],
                "errors": result["errors"],
                "error_log": result.get("error_log"),
                "duration": result["duration_ms"],
            },
        )

        execute_query(
            'UPDATE "ScraperConfig" SET last_run_at = NOW() WHERE id = :id',
            {"id": config_id},
        )

        logger.info(
            f"Scrape complete for {config['store_name']}: "
            f"{result['products_found']} found, {result['prices_updated']} updated, "
            f"{result['errors']} errors in {result['duration_ms']}ms"
        )

        return result

    except Exception as exc:
        execute_query(
            """
            UPDATE "ScraperRun" SET
                status = 'FAILED',
                error_log = :error,
                completed_at = NOW()
            WHERE id = :id
            """,
            {"id": run_id, "error": str(exc)[:2000]},
        )
        logger.error(f"Scrape failed for {config['store_name']}: {exc}")
        raise self.retry(exc=exc)


@app.task(name="src.tasks.update_aggregates")
def update_aggregates():
    execute_query("""
        UPDATE "Product" p SET
            lowest_price = sub.min_price,
            highest_price = sub.max_price,
            avg_price = sub.avg_price,
            listing_count = sub.cnt
        FROM (
            SELECT
                product_id,
                MIN(COALESCE(sale_price, price)) as min_price,
                MAX(COALESCE(sale_price, price)) as max_price,
                AVG(COALESCE(sale_price, price))::INT as avg_price,
                COUNT(*) as cnt
            FROM "Listing"
            WHERE is_active = true
            GROUP BY product_id
        ) sub
        WHERE p.id = sub.product_id
    """)
    logger.info("Product aggregates updated")


@app.task(name="src.tasks.check_alerts")
def check_alerts():
    alerts = fetch_all("""
        SELECT a.id, a.user_id, a.product_id, a.type, a.threshold,
               p.title, p.slug,
               (SELECT COALESCE(sale_price, price) FROM "Listing"
                WHERE product_id = a.product_id AND is_active = true
                ORDER BY COALESCE(sale_price, price) ASC LIMIT 1) as current_price
        FROM "Alert" a
        JOIN "Product" p ON a.product_id = p.id
        WHERE a.is_active = true
    """)

    fired = 0
    for alert in alerts:
        if not alert["current_price"]:
            continue

        should_fire = False
        message = ""

        if alert["type"] == "PRICE_DROP":
            prev = fetch_one(
                """
                SELECT price FROM "PriceHistory"
                WHERE product_id = :pid ORDER BY timestamp DESC OFFSET 1 LIMIT 1
                """,
                {"pid": alert["product_id"]},
            )
            if prev and alert["current_price"] < prev["price"]:
                drop = round((prev["price"] - alert["current_price"]) / prev["price"] * 100, 1)
                should_fire = True
                message = f"{alert['title']} انخفض {drop}% — الآن {alert['current_price'] / 100:.0f} ج.م"

        elif alert["type"] == "PRICE_TARGET":
            if alert["threshold"] and alert["current_price"] <= alert["threshold"]:
                should_fire = True
                message = f"{alert['title']} وصل للسعر المطلوب: {alert['current_price'] / 100:.0f} ج.م"

        if should_fire:
            execute_query(
                """
                INSERT INTO "Notification" (id, user_id, type, title, body, data)
                VALUES (gen_random_uuid(), :user_id, :type, :title, :body, :data::jsonb)
                """,
                {
                    "user_id": alert["user_id"],
                    "type": alert["type"],
                    "title": "سعر أقل!" if alert["type"] == "PRICE_DROP" else "وصل للسعر المطلوب!",
                    "body": message,
                    "data": f'{{"productSlug": "{alert["slug"]}"}}',
                },
            )
            execute_query(
                'UPDATE "Alert" SET last_fired_at = NOW() WHERE id = :id',
                {"id": alert["id"]},
            )
            fired += 1

    logger.info(f"Alert check: {fired} fired out of {len(alerts)}")


@app.task(name="src.tasks.verify_listings_health")
def verify_listings_health(batch_size: int = HEALTH_CHECK_BATCH):
    """Rolling URL health check — picks the oldest-verified active listings and re-checks them.

    Listings returning 404 are deactivated; suspicious responses are flagged but kept.
    """
    listings = fetch_all(
        """
        SELECT id, external_url, consecutive_failures
        FROM "Listing"
        WHERE is_active = true AND external_url IS NOT NULL AND external_url <> ''
        ORDER BY COALESCE(last_verified_at, '1970-01-01'::timestamp) ASC
        LIMIT :n
        """,
        {"n": batch_size},
    )

    checked = 0
    dead = 0
    suspicious = 0
    healthy = 0

    for listing in listings:
        try:
            status, is_dead, raw = check_listing_url(listing["external_url"])
        except Exception as e:
            logger.warning(f"Health check error for listing {listing['id']}: {e}")
            continue

        checked += 1
        failures = listing.get("consecutive_failures") or 0

        if is_dead:
            # Three strikes rule: only deactivate after multiple confirmations.
            new_failures = failures + 1
            should_deactivate = new_failures >= 3
            execute_query(
                """
                UPDATE "Listing" SET
                    verification_status = 'DEAD'::"VerificationStatus",
                    consecutive_failures = :f,
                    last_failed_at = NOW(),
                    is_active = CASE WHEN :deact THEN false ELSE is_active END,
                    updated_at = NOW()
                WHERE id = :id
                """,
                {"id": listing["id"], "f": new_failures, "deact": should_deactivate},
            )
            dead += 1
        elif status == "SUSPICIOUS":
            execute_query(
                """
                UPDATE "Listing" SET
                    verification_status = 'SUSPICIOUS'::"VerificationStatus",
                    consecutive_failures = :f,
                    last_failed_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id
                """,
                {"id": listing["id"], "f": failures + 1},
            )
            suspicious += 1
        elif status == "VERIFIED":
            execute_query(
                """
                UPDATE "Listing" SET
                    verification_status = 'VERIFIED'::"VerificationStatus",
                    last_verified_at = NOW(),
                    consecutive_failures = 0,
                    updated_at = NOW()
                WHERE id = :id
                """,
                {"id": listing["id"]},
            )
            healthy += 1
        else:
            # STALE — couldn't conclude (blocked / transient). Just bump last_verified_at lightly.
            execute_query(
                """
                UPDATE "Listing" SET
                    verification_status = 'STALE'::"VerificationStatus",
                    updated_at = NOW()
                WHERE id = :id
                """,
                {"id": listing["id"]},
            )

    logger.info(
        f"Health check: {checked} checked, {healthy} verified, "
        f"{suspicious} suspicious, {dead} dead-marked"
    )
    return {"checked": checked, "healthy": healthy, "suspicious": suspicious, "dead": dead}


@app.task(name="src.tasks.refresh_stale_listings")
def refresh_stale_listings():
    """Find listings whose prices are older than their store's freshness budget and re-queue scrapes.

    Prioritizes listings on popular products (by viewCount + clickCount).
    """
    queued_by_store: dict[str, int] = {}

    for freq, hours in FRESHNESS_HOURS_BY_FREQUENCY.items():
        stale = fetch_all(
            """
            SELECT sc.id AS config_id, s.slug AS store_slug, COUNT(l.id) AS stale_count
            FROM "ScraperConfig" sc
            JOIN "Store" s ON sc.store_id = s.id
            LEFT JOIN "Listing" l ON l.store_id = sc.store_id
              AND l.is_active = true
              AND (l.last_verified_at IS NULL OR l.last_verified_at < NOW() - (:hours || ' hours')::interval)
            WHERE sc.is_active = true AND sc.frequency = :freq AND s.is_active = true
            GROUP BY sc.id, s.slug
            HAVING COUNT(l.id) > 0
            ORDER BY COUNT(l.id) DESC
            """,
            {"hours": hours, "freq": freq},
        )

        for row in stale:
            scrape_store.delay(row["config_id"])
            queued_by_store[row["store_slug"]] = (queued_by_store.get(row["store_slug"]) or 0) + 1

    logger.info(f"Stale refresh: queued {sum(queued_by_store.values())} scrapes: {queued_by_store}")
    return queued_by_store
