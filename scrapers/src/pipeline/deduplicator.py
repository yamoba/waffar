import re
import logging
import hashlib
from ..db import fetch_one, execute_query

logger = logging.getLogger(__name__)


def find_or_create_product(normalized: dict) -> str:
    title = normalized["title"]
    brand = normalized.get("brand")
    model = normalized.get("model")

    # Try exact match by brand + model
    if brand and model:
        existing = fetch_one(
            """
            SELECT id FROM "Product"
            WHERE LOWER(brand) = LOWER(:brand) AND LOWER(model) = LOWER(:model)
            LIMIT 1
            """,
            {"brand": brand, "model": model},
        )
        if existing:
            return existing["id"]

    # Try fuzzy title match using trigram similarity
    existing = fetch_one(
        """
        SELECT id, title, similarity(LOWER(title), LOWER(:title)) as sim
        FROM "Product"
        WHERE similarity(LOWER(title), LOWER(:title)) > 0.6
        ORDER BY sim DESC
        LIMIT 1
        """,
        {"title": title},
    )
    if existing and existing["sim"] > 0.6:
        logger.debug(f"Matched '{title}' -> '{existing['title']}' (sim={existing['sim']:.2f})")
        return existing["id"]

    # Create new product
    slug = generate_slug(title, brand)
    product_id = execute_query(
        """
        INSERT INTO "Product" (
            id, title, title_ar, slug, brand, model, category, subcategory,
            description, image_url, images, specs, tags, match_confidence
        ) VALUES (
            gen_random_uuid(), :title, :title_ar, :slug, :brand, :model,
            :category, :subcategory, :description, :image_url,
            :images, :specs::jsonb, :tags, :confidence
        )
        ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
        RETURNING id
        """,
        {
            "title": title,
            "title_ar": normalized.get("title_ar"),
            "slug": slug,
            "brand": brand,
            "model": model,
            "category": normalized.get("category", "Other"),
            "subcategory": normalized.get("subcategory"),
            "description": normalized.get("description"),
            "image_url": normalized.get("image_url"),
            "images": normalized.get("images", []),
            "specs": str(normalized.get("specs")) if normalized.get("specs") else None,
            "tags": normalized.get("tags", []),
            "confidence": 1.0 if (brand and model) else 0.8,
        },
    ).fetchone()[0]

    logger.info(f"Created new product: {title} [{product_id}]")
    return product_id


def generate_slug(title: str, brand: str = None) -> str:
    parts = []
    if brand:
        parts.append(brand.lower())
    parts.append(title.lower())
    text = " ".join(parts)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    text = text[:180]

    suffix = hashlib.md5(title.encode()).hexdigest()[:6]
    return f"{text}-{suffix}"
