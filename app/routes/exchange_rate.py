from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import redis.asyncio as redis
from app.cache import get_redis
from app.services.exchange_rate_service import ExchangeRateService


class ExchangeRateResponse(BaseModel):
    USD_EUR: float
    USD_INR: float


router = APIRouter(prefix="/exchange-rate", tags=["exchange-rate"])


@router.get("/", response_model=ExchangeRateResponse)
async def get_exchange_rate(
    redis_client: redis.Redis = Depends(get_redis)
) -> ExchangeRateResponse:
    """
    Get USD to EUR and INR exchange rates. Caches result for 6 hours.
    """
    try:
        service = ExchangeRateService(redis_client)
        rates = await service.get_usd_rates()
        if not rates or "USD_EUR" not in rates or "USD_INR" not in rates:
            raise HTTPException(
                status_code=503, detail="Exchange rates unavailable")
        return ExchangeRateResponse(**rates)
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Exchange rates unavailable: {e}")
