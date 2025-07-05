import httpx
import redis.asyncio as redis
import logging
from typing import Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class ExchangeRateService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.cache_ttl = 21600  # 6 hours in seconds
        self.api_key = settings.exchange_api_key

    async def get_usd_rates(self) -> Dict[str, float]:
        cache_key = "exchange:usd_rates"
        # Try cache first
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        # Fetch from API
        rates = await self._fetch_from_api()
        if rates:
            await self._cache_rates(cache_key, rates)
            return rates
        # Fallback: return stale cache if available
        cached = await self._get_from_cache(cache_key, ignore_expiry=True)
        if cached:
            logger.warning("API failed, returning stale exchange rate cache")
            return cached
        logger.error(
            "API failed and no cache available, returning empty rates")
        return {}

    async def _get_from_cache(self, cache_key: str, ignore_expiry: bool = False) -> Optional[Dict[str, float]]:
        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                import json
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Error reading from cache: {e}")
            return None

    async def _cache_rates(self, cache_key: str, rates: Dict[str, float]):
        try:
            import json
            await self.redis_client.setex(cache_key, self.cache_ttl, json.dumps(rates))
        except Exception as e:
            logger.error(f"Error caching exchange rates: {e}")

    async def _fetch_from_api(self) -> Optional[Dict[str, float]]:
        if not self.api_key:
            logger.error("ExchangeRate-API key not configured")
            return None
        url = f"https://v6.exchangerate-api.com/v6/{self.api_key}/latest/USD"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code == 429:
                    logger.error("ExchangeRate-API rate limit exceeded")
                    return None
                resp.raise_for_status()
                data = resp.json()
                rates = data.get("conversion_rates", {})
                return {
                    "USD_EUR": round(rates.get("EUR", 0), 4),
                    "USD_INR": round(rates.get("INR", 0), 4)
                }
        except Exception as e:
            logger.error(f"ExchangeRate-API error: {e}")
            return None
