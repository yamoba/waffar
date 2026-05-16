from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    userId: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    metadata: Optional[dict] = None


INTENT_KEYWORDS = {
    "compare": ["قارن", "الفرق", "أحسن", "أفضل", "compare", "difference", "better", "vs"],
    "recommend": ["انصحني", "أشتري", "اقترح", "recommend", "suggest", "should i buy"],
    "price": ["سعر", "كام", "بكام", "price", "cost", "how much"],
    "deal": ["عرض", "خصم", "تخفيض", "deal", "discount", "sale", "offer"],
    "budget": ["ميزانية", "budget", "أرخص", "cheapest", "affordable"],
}


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    msg = req.message.lower()

    intent = "general"
    for key, keywords in INTENT_KEYWORDS.items():
        if any(kw in msg for kw in keywords):
            intent = key
            break

    responses = {
        "compare": "أهلاً! عشان أقارنلك بين المنتجات، محتاج تقولي أسماء المنتجات اللي عايز تقارن بينهم. أو ممكن تبحث عنهم واستخدم زرار المقارنة.",
        "recommend": "أهلاً! عشان أنصحك صح، قولي: إيه نوع المنتج؟ ميزانيتك كام؟ وإيه أهم حاجة بالنسبالك (الأداء، البطارية، الكاميرا...)؟",
        "price": "أهلاً! ابحث عن المنتج في وفر وهتلاقي مقارنة الأسعار من كل المتاجر مع تاريخ السعر. عايزني أساعدك تدور على حاجة معينة؟",
        "deal": "أهلاً! تقدر تتصفح قسم العروض عشان تشوف أكبر التخفيضات الحقيقية. كمان ممكن تفعّل تنبيهات على أي منتج عشان نبلغك أول ما السعر ينزل.",
        "budget": "أهلاً! قولي ميزانيتك ونوع المنتج اللي بتدور عليه، وهساعدك تلاقي أحسن خيار في حدود ميزانيتك.",
        "general": "أهلاً بك في مستشار وفر الذكي! أقدر أساعدك في:\n• مقارنة المنتجات\n• نصائح الشراء\n• معرفة أفضل وقت للشراء\n• اقتراح بدائل\n• مراجعة الميزانية\n\nإيه اللي تحب أساعدك فيه؟",
    }

    return ChatResponse(
        reply=responses[intent],
        metadata={"intent": intent, "language": "ar"},
    )
