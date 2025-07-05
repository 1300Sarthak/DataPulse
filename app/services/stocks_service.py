import httpx
import redis.asyncio as redis
import json
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


class StocksService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.cache_ttl = 60  # 1 minute
        # Use Finnhub API key from STOCKS_API_KEY
        self.finnhub_key = settings.stocks_api_key

    async def get_stock_price(self, symbol: str) -> Optional[float]:
        if not symbol:
            raise ValueError("Missing symbol parameter")
        symbol = symbol.upper()
        cache_key = f"stock_price:{symbol}"
        # Try cache first
        cached = await self._get_from_cache(cache_key)
        if cached is not None:
            return cached
        # Fetch from API
        price = await self._fetch_from_api(symbol)
        if price is not None:
            await self._cache_price(cache_key, price)
            return price
        # Fallback: return stale cache if available
        cached = await self._get_from_cache(cache_key, ignore_expiry=True)
        if cached is not None:
            logger.warning(f"API failed, returning stale cache for {symbol}")
            return cached
        raise Exception(f"Unable to fetch price for {symbol}")

    async def _get_from_cache(self, cache_key: str, ignore_expiry: bool = False) -> Optional[float]:
        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                return float(cached)
            return None
        except Exception as e:
            logger.error(f"Error reading from cache: {e}")
            return None

    async def _cache_price(self, cache_key: str, price: float):
        try:
            await self.redis_client.setex(cache_key, self.cache_ttl, str(price))
        except Exception as e:
            logger.error(f"Error caching stock price: {e}")

    async def _fetch_from_api(self, symbol: str) -> Optional[float]:
        if not self.finnhub_key:
            raise Exception("Finnhub API key not configured")

        url = "https://finnhub.io/api/v1/quote"
        params = {"symbol": symbol, "token": self.finnhub_key}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)

                if resp.status_code == 403:
                    logger.error("Finnhub API rate limit exceeded")
                    raise Exception("API rate limit exceeded")

                resp.raise_for_status()
                data = resp.json()

                if "c" in data and isinstance(data["c"], (int, float)):
                    return float(data["c"])
                elif "error" in data:
                    logger.error(f"Finnhub error: {data['error']}")
                    raise ValueError(f"Invalid symbol: {symbol}")
                else:
                    logger.error(f"Unexpected response format: {data}")
                    raise Exception("Invalid API response format")

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                logger.error("Finnhub API rate limit exceeded")
                raise Exception("API rate limit exceeded")
            elif e.response.status_code == 404:
                raise ValueError(f"Symbol not found: {symbol}")
            else:
                logger.error(f"Finnhub API HTTP error: {e}")
                raise Exception(f"API request failed: {e}")
        except ValueError:
            # Re-raise ValueError exceptions without wrapping
            raise
        except Exception as e:
            logger.error(f"Finnhub API error: {e}")
            raise Exception(f"API request failed: {e}")
