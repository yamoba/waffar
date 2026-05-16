import re
import logging

logger = logging.getLogger(__name__)

BRAND_PATTERNS = [
    "apple", "samsung", "huawei", "xiaomi", "oppo", "vivo", "realme", "nokia",
    "sony", "lg", "panasonic", "philips", "toshiba", "sharp", "hisense",
    "lenovo", "dell", "hp", "asus", "acer", "msi", "microsoft",
    "dyson", "bosch", "electrolux", "whirlpool", "beko",
    "jbl", "bose", "marshall", "beats", "anker", "baseus",
    "canon", "nikon", "gopro", "dji",
    "nintendo", "logitech", "razer", "corsair", "steelseries",
]


def normalize_product_data(raw: dict, store_slug: str) -> dict:
    title = clean_title(raw.get("title", ""))
    brand = extract_brand(title, raw.get("brand"))
    model = extract_model(title)
    category = raw.get("category", guess_category(title))
    price = parse_price(raw.get("price", 0))
    sale_price = parse_price(raw.get("sale_price")) if raw.get("sale_price") else None

    if sale_price and sale_price >= price:
        sale_price = None

    return {
        "title": title,
        "title_ar": raw.get("title_ar"),
        "brand": brand,
        "model": model,
        "category": category,
        "subcategory": raw.get("subcategory"),
        "description": raw.get("description"),
        "image_url": raw.get("image_url"),
        "images": raw.get("images", []),
        "specs": raw.get("specs"),
        "tags": extract_tags(title, brand, category),
        "price": price,
        "sale_price": sale_price,
        "in_stock": raw.get("in_stock", True),
        "stock_count": raw.get("stock_count"),
        "shipping_cost": parse_price(raw.get("shipping_cost")) if raw.get("shipping_cost") else None,
        "free_shipping": raw.get("free_shipping", False),
        "shipping_days": raw.get("shipping_days"),
        "return_days": raw.get("return_days"),
        "installment": raw.get("installment"),
        "warranty": raw.get("warranty"),
        "rating": raw.get("rating"),
        "review_count": raw.get("review_count"),
        "url": raw.get("url"),
        "external_id": raw.get("external_id") or raw.get("asin") or raw.get("sku"),
        "condition": raw.get("condition", "NEW"),
        "seller_name": raw.get("seller_name"),
        "store_slug": store_slug,
    }


def clean_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title).strip()
    title = re.sub(r"[^\w\s\-/().+,،]", "", title)
    noise = [
        r"\b(free shipping|شحن مجاني)\b",
        r"\b(best price|أفضل سعر)\b",
        r"\b(limited offer|عرض محدود)\b",
        r"\b(new arrival|وصل حديثاً)\b",
    ]
    for pattern in noise:
        title = re.sub(pattern, "", title, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", title).strip()


def extract_brand(title: str, raw_brand: str = None) -> str:
    if raw_brand:
        return raw_brand.strip().title()

    title_lower = title.lower()
    for brand in BRAND_PATTERNS:
        if brand in title_lower:
            return brand.title()

    return None


def extract_model(title: str) -> str:
    patterns = [
        r"([A-Z]{1,3}\d{2,4}[A-Z]?\d{0,2})",
        r"((?:SM|GT|A)\-?\w{3,10})",
        r"(iPhone\s*\d{1,2}\s*(?:Pro\s*Max|Pro|Plus|Mini)?)",
        r"(Galaxy\s*(?:S|A|M|Z)\d{1,2}\s*(?:Ultra|Plus|FE)?)",
        r"(MacBook\s*(?:Air|Pro)\s*(?:M\d)?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def guess_category(title: str) -> str:
    title_lower = title.lower()
    categories = {
        "Smartphones": ["phone", "mobile", "iphone", "galaxy", "موبايل", "هاتف"],
        "Laptops": ["laptop", "notebook", "macbook", "لابتوب"],
        "TVs": ["tv", "television", "تلفزيون", "شاشة"],
        "Audio": ["headphone", "earphone", "earbuds", "speaker", "سماعة"],
        "Gaming": ["playstation", "xbox", "nintendo", "gaming", "بلايستيشن"],
        "Home Appliances": ["washer", "fridge", "refrigerator", "microwave", "vacuum", "غسالة", "ثلاجة"],
        "Tablets": ["tablet", "ipad", "تابلت"],
        "Wearables": ["watch", "smartwatch", "band", "ساعة"],
        "Cameras": ["camera", "gopro", "كاميرا"],
    }
    for cat, keywords in categories.items():
        if any(kw in title_lower for kw in keywords):
            return cat
    return "Other"


def extract_tags(title: str, brand: str, category: str) -> list:
    tags = []
    if brand:
        tags.append(brand.lower())
    if category:
        tags.append(category.lower())

    title_lower = title.lower()
    tag_keywords = ["5g", "wifi", "bluetooth", "oled", "amoled", "4k", "8k", "hdr", "usb-c", "wireless"]
    for kw in tag_keywords:
        if kw in title_lower:
            tags.append(kw)

    return list(set(tags))


def parse_price(value) -> int:
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return int(value * 100) if value < 100000 else int(value)

    text = str(value)
    text = re.sub(r"[^\d.,]", "", text)
    text = text.replace(",", "")

    try:
        num = float(text)
        return int(num * 100)
    except (ValueError, TypeError):
        return 0
