from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class GiftRequest(BaseModel):
    budget: Optional[int] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    interest: Optional[str] = None


GIFT_DB = {
    "tech": [
        {"title": "سماعات بلوتوث لاسلكية", "category": "Audio", "priceRange": "200-800"},
        {"title": "باور بانك 20000mAh", "category": "Accessories", "priceRange": "300-600"},
        {"title": "ساعة ذكية", "category": "Wearables", "priceRange": "500-3000"},
        {"title": "سبيكر بلوتوث", "category": "Audio", "priceRange": "300-1500"},
    ],
    "gaming": [
        {"title": "يد تحكم لاسلكية", "category": "Gaming", "priceRange": "400-1500"},
        {"title": "ماوس جيمنج", "category": "Gaming", "priceRange": "200-1000"},
        {"title": "كيبورد ميكانيكي", "category": "Gaming", "priceRange": "500-2000"},
        {"title": "سماعة جيمنج", "category": "Audio", "priceRange": "300-1500"},
    ],
    "home": [
        {"title": "خلاط كهربائي", "category": "Home Appliances", "priceRange": "300-1500"},
        {"title": "مكنسة كهربائية محمولة", "category": "Home Appliances", "priceRange": "500-3000"},
        {"title": "جهاز تنقية هواء", "category": "Home Appliances", "priceRange": "1000-5000"},
    ],
    "general": [
        {"title": "سماعات لاسلكية", "category": "Audio", "priceRange": "200-800"},
        {"title": "حافظة تابلت", "category": "Accessories", "priceRange": "100-500"},
        {"title": "شاحن لاسلكي", "category": "Accessories", "priceRange": "150-500"},
        {"title": "كاميرا فورية", "category": "Cameras", "priceRange": "800-2000"},
    ],
}


@router.post("/gift-suggestions")
def suggest_gifts(req: GiftRequest):
    interest = (req.interest or "general").lower()
    suggestions = GIFT_DB.get(interest, GIFT_DB["general"])

    if req.budget:
        budget_egp = req.budget / 100
        filtered = []
        for s in suggestions:
            price_range = s["priceRange"].split("-")
            min_price = int(price_range[0])
            if min_price <= budget_egp:
                filtered.append(s)
        suggestions = filtered if filtered else suggestions[:2]

    return {"suggestions": suggestions}
