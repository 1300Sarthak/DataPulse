from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import redis.asyncio as redis
from app.cache import get_redis
from app.services.stocks_service import StocksService
from typing import Dict


class StockPriceResponse(BaseModel):
    symbol: str
    price: float


router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/", response_model=StockPriceResponse)
async def get_stock_price(
    symbol: str = Query(..., description="Stock symbol, e.g. AAPL"),
    redis_client: redis.Redis = Depends(get_redis)
) -> StockPriceResponse:
    """
    Get real-time stock price for a symbol from Finnhub.
    Caches result for 60 seconds.
    """
    try:
        service = StocksService(redis_client)
        price = await service.get_stock_price(symbol)
        return StockPriceResponse(symbol=symbol.upper(), price=price)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if "rate limit" in str(e).lower():
            raise HTTPException(
                status_code=429, detail="API rate limit exceeded")
        elif "not configured" in str(e).lower():
            raise HTTPException(
                status_code=500, detail="API configuration error")
        else:
            raise HTTPException(
                status_code=503, detail=f"Unable to fetch stock price: {e}")
