from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import numpy as np

router = APIRouter()


class PricePoint(BaseModel):
    price: int
    salePrice: Optional[int] = None
    timestamp: str


class Listing(BaseModel):
    price: int
    salePrice: Optional[int] = None
    store: Optional[dict] = None


class Product(BaseModel):
    id: str
    title: str
    lowestPrice: Optional[int] = None
    highestPrice: Optional[int] = None
    avgPrice: Optional[int] = None
    listings: list[Listing] = []


class AdviceRequest(BaseModel):
    product: Product
    priceHistory: list[PricePoint] = []


class AdviceResponse(BaseModel):
    recommendation: str
    confidence: float
    reasoning: str
    priceOutlook: str
    expectedSaleDate: Optional[str] = None
    alternatives: list[dict] = []


@router.post("/advice", response_model=AdviceResponse)
def get_advice(req: AdviceRequest):
    prices = [p.salePrice or p.price for p in req.priceHistory if p.price > 0]

    if len(prices) < 3:
        return AdviceResponse(
            recommendation="BUY_NOW",
            confidence=0.5,
            reasoning="لا توجد بيانات كافية لتحليل اتجاه السعر. السعر الحالي يبدو معقولاً.",
            priceOutlook="stable",
        )

    prices_arr = np.array(prices, dtype=float)
    current = prices_arr[-1]
    mean_price = float(np.mean(prices_arr))
    min_price = float(np.min(prices_arr))
    max_price = float(np.max(prices_arr))
    std_price = float(np.std(prices_arr))

    # Simple trend: compare last 5 to first 5
    recent = float(np.mean(prices_arr[-5:])) if len(prices_arr) >= 5 else current
    older = float(np.mean(prices_arr[:5])) if len(prices_arr) >= 5 else mean_price

    trend = "stable"
    if recent < older * 0.95:
        trend = "down"
    elif recent > older * 1.05:
        trend = "up"

    # Determine recommendation
    if current <= min_price * 1.02:
        recommendation = "GREAT_DEAL"
        confidence = 0.85
        reasoning = f"السعر الحالي ({current/100:.0f} ج.م) قريب جداً من أقل سعر تاريخي ({min_price/100:.0f} ج.م). فرصة ممتازة للشراء."
    elif current < mean_price * 0.9:
        recommendation = "BUY_NOW"
        confidence = 0.75
        reasoning = f"السعر الحالي ({current/100:.0f} ج.م) أقل من المتوسط ({mean_price/100:.0f} ج.م) بنسبة {((mean_price - current) / mean_price * 100):.0f}%. وقت مناسب للشراء."
    elif trend == "down":
        recommendation = "WAIT"
        confidence = 0.65
        reasoning = f"السعر في اتجاه نزولي. ممكن ينزل أكتر. المتوسط ({mean_price/100:.0f} ج.م)."
    elif current > mean_price * 1.1:
        recommendation = "AVOID"
        confidence = 0.7
        reasoning = f"السعر الحالي ({current/100:.0f} ج.م) أعلى من المتوسط ({mean_price/100:.0f} ج.م). استنى لحد ما ينزل."
    else:
        recommendation = "BUY_NOW"
        confidence = 0.6
        reasoning = f"السعر قريب من المتوسط ({mean_price/100:.0f} ج.م). السعر مستقر ومعقول."

    return AdviceResponse(
        recommendation=recommendation,
        confidence=confidence,
        reasoning=reasoning,
        priceOutlook=trend,
    )
