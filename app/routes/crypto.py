from fastapi import APIRouter, Depends, HTTPException, Query
import redis.asyncio as redis
from app.cache import get_redis
from app.services.crypto_service import CryptoService
from typing import List, Dict, Optional

router = APIRouter(prefix="/crypto", tags=["crypto"])


@router.get("/")
async def get_crypto_prices(
    top_n: int = Query(
        50, ge=1, le=100, description="Number of top cryptos to return (1-100)"),
    redis_client: redis.Redis = Depends(get_redis)
) -> List[Dict]:
    """
    Get top N cryptocurrencies by market cap from CoinGecko API.
    Returns cached data if available (1 minute cache).
    Falls back to stale cache if API is unavailable.
    """
    try:
        crypto_service = CryptoService(redis_client)
        prices = await crypto_service.get_crypto_prices(top_n=top_n)
        return prices
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch crypto prices: {str(e)}"
        )


@router.get("/historical/{symbol}")
async def get_crypto_historical_data(
    symbol: str,
    days: str = Query(
        "1", description="Number of days (1, 7, 14, 30, 90, 180, 365, max)"),
    redis_client: redis.Redis = Depends(get_redis)
) -> Dict:
    """
    Get historical price data for a cryptocurrency.
    Available time periods: 1, 7, 14, 30, 90, 180, 365, max days.
    """
    try:
        crypto_service = CryptoService(redis_client)

        # First get the coin ID from symbol
        coin_id = await crypto_service.get_crypto_id(symbol)
        if not coin_id:
            raise HTTPException(
                status_code=404,
                detail=f"Cryptocurrency with symbol '{symbol}' not found"
            )

        # Get historical data
        data = await crypto_service.get_crypto_historical_data(coin_id, days)
        if not data:
            raise HTTPException(
                status_code=503,
                detail=f"Unable to fetch historical data for {symbol}"
            )

        return {
            "symbol": symbol.upper(),
            "coin_id": coin_id,
            "days": days,
            **data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch crypto historical data: {str(e)}"
        )
