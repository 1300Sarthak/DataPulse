from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import redis.asyncio as redis
from app.cache import get_redis
from app.services.stocks_service import StocksService
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class StockPriceResponse(BaseModel):
    symbol: str
    price: float


class StockListItem(BaseModel):
    symbol: str
    name: str
    price: float


router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/list", response_model=List[StockListItem], name="Get top N stocks")
async def get_top_stocks(
    top_n: int = Query(
        10, ge=1, le=25, description="Number of top stocks to return (max 25 for free plan)"),
    redis_client: redis.Redis = Depends(get_redis)
) -> List[StockListItem]:
    """
    Get a list of top N stocks (symbol, name, price).
    """
    try:
        service = StocksService(redis_client)
        stocks = await service.get_top_stocks(top_n)
        return [StockListItem(**stock) for stock in stocks]
    except Exception as e:
        if "rate limit" in str(e).lower():
            raise HTTPException(
                status_code=429, detail="API rate limit exceeded")
        elif "not configured" in str(e).lower():
            raise HTTPException(
                status_code=500, detail="API configuration error")
        else:
            raise HTTPException(
                status_code=503, detail=f"Unable to fetch top stocks: {e}")


@router.get("/price", response_model=StockPriceResponse)
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


@router.get("/historical/{symbol}")
async def get_stock_historical_data(
    symbol: str,
    period: str = Query(
        "1D", description="Time period: 1H, 1D, 1W, 1M, 3M, 1Y"),
    redis_client: redis.Redis = Depends(get_redis)
) -> Dict:
    """
    Get historical price data for a stock.
    Available time periods: 1H, 1D, 1W, 1M, 3M, 1Y.
    """
    try:
        service = StocksService(redis_client)
        data = await service.get_stock_historical_data_by_period(symbol, period)

        if not data:
            raise HTTPException(
                status_code=503,
                detail=f"Unable to fetch historical data for {symbol}"
            )

        return {
            "symbol": symbol.upper(),
            "period": period,
            **data
        }
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
                status_code=503, detail=f"Unable to fetch stock historical data: {e}")
