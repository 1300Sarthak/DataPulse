from fastapi import APIRouter, Depends, HTTPException
import redis.asyncio as redis
from app.cache import get_redis
from app.services.crypto_service import CryptoService
from typing import Dict

router = APIRouter(prefix="/crypto", tags=["crypto"])


@router.get("/")
async def get_crypto_prices(
    redis_client: redis.Redis = Depends(get_redis)
) -> Dict[str, float]:
    """
    Get current BTC and ETH prices from CoinGecko API.

    Returns cached data if available (1 minute cache).
    Falls back to stale cache if API is unavailable.
    """
    try:
        crypto_service = CryptoService(redis_client)
        prices = await crypto_service.get_crypto_prices()
        return prices
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch crypto prices: {str(e)}"
        )
