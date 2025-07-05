import httpx
import redis.asyncio as redis
import json
import logging
from typing import Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class CryptoService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.base_url = "https://api.coingecko.com/api/v3"
        self.cache_key = "crypto_prices"
        self.cache_ttl = 60  # 1 minute in seconds

    async def get_crypto_prices(self) -> Dict[str, float]:
        """Get BTC and ETH prices with Redis caching"""
        try:
            # Check cache first
            cached_data = await self._get_from_cache()
            if cached_data:
                logger.info("Returning cached crypto prices")
                return cached_data

            # Fetch from API
            prices = await self._fetch_from_api()
            if prices:
                # Cache the response
                await self._cache_prices(prices)
                return prices
            else:
                # Return cached data even if expired as fallback
                cached_data = await self._get_from_cache(ignore_expiry=True)
                if cached_data:
                    logger.warning("API failed, returning stale cached data")
                    return cached_data
                raise Exception("API unavailable and no cached data")

        except Exception as e:
            logger.error(f"Error fetching crypto prices: {e}")
            # Try to return cached data as fallback
            cached_data = await self._get_from_cache(ignore_expiry=True)
            if cached_data:
                logger.warning("Returning stale cached data due to error")
                return cached_data
            raise

    async def _get_from_cache(self, ignore_expiry: bool = False) -> Optional[Dict[str, float]]:
        """Get prices from Redis cache"""
        try:
            cached = await self.redis_client.get(self.cache_key)
            if cached:
                data = json.loads(cached)
                logger.info("Retrieved crypto prices from cache")
                return data
            return None
        except Exception as e:
            logger.error(f"Error reading from cache: {e}")
            return None

    async def _cache_prices(self, prices: Dict[str, float]) -> None:
        """Cache prices in Redis"""
        try:
            await self.redis_client.setex(
                self.cache_key,
                self.cache_ttl,
                json.dumps(prices)
            )
            logger.info("Cached crypto prices")
        except Exception as e:
            logger.error(f"Error caching prices: {e}")

    async def _fetch_from_api(self) -> Optional[Dict[str, float]]:
        """Fetch prices from CoinGecko API"""
        try:
            # CoinGecko IDs for BTC and ETH
            ids = "bitcoin,ethereum"
            url = f"{self.base_url}/simple/price"
            params = {
                "ids": ids,
                "vs_currencies": "usd"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()

                data = response.json()

                # Extract prices
                prices = {
                    "BTC": data.get("bitcoin", {}).get("usd", 0.0),
                    "ETH": data.get("ethereum", {}).get("usd", 0.0)
                }

                # Validate prices
                if prices["BTC"] <= 0 or prices["ETH"] <= 0:
                    logger.error("Invalid prices received from API")
                    return None

                logger.info(
                    f"Fetched crypto prices: BTC=${prices['BTC']:.2f}, ETH=${prices['ETH']:.2f}")
                return prices

        except httpx.TimeoutException:
            logger.error("CoinGecko API timeout")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"CoinGecko API HTTP error: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching from CoinGecko API: {e}")
            return None
