import httpx
import redis.asyncio as redis
import json
import logging
from typing import Dict, Optional, List
from app.config import settings

logger = logging.getLogger(__name__)


class CryptoService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.base_url = "https://api.coingecko.com/api/v3"
        self.cache_key = "crypto_prices"
        self.cache_ttl = 60  # 1 minute in seconds

    async def get_crypto_prices(self, top_n: int = 50) -> List[Dict]:
        """Get top N crypto prices with Redis caching"""
        try:
            # Check cache first
            cached_data = await self._get_from_cache(top_n)
            if cached_data:
                logger.info("Returning cached crypto prices")
                return cached_data

            # Fetch from API
            prices = await self._fetch_from_api(top_n)
            if prices:
                # Cache the response
                await self._cache_prices(prices, top_n)
                return prices
            else:
                # Return cached data even if expired as fallback
                cached_data = await self._get_from_cache(top_n, ignore_expiry=True)
                if cached_data:
                    logger.warning("API failed, returning stale cached data")
                    return cached_data
                raise Exception("API unavailable and no cached data")

        except Exception as e:
            logger.error(f"Error fetching crypto prices: {e}")
            # Try to return cached data as fallback
            cached_data = await self._get_from_cache(top_n, ignore_expiry=True)
            if cached_data:
                logger.warning("Returning stale cached data due to error")
                return cached_data
            raise

    async def _get_from_cache(self, top_n: int, ignore_expiry: bool = False) -> Optional[List[Dict]]:
        """Get prices from Redis cache"""
        try:
            cache_key = f"{self.cache_key}:{top_n}"
            cached = await self.redis_client.get(cache_key)
            if cached:
                data = json.loads(cached)
                logger.info("Retrieved crypto prices from cache")
                return data
            return None
        except Exception as e:
            logger.error(f"Error reading from cache: {e}")
            return None

    async def _cache_prices(self, prices: List[Dict], top_n: int) -> None:
        """Cache prices in Redis"""
        try:
            cache_key = f"{self.cache_key}:{top_n}"
            await self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(prices)
            )
            logger.info("Cached crypto prices")
        except Exception as e:
            logger.error(f"Error caching prices: {e}")

    async def _fetch_from_api(self, top_n: int) -> Optional[List[Dict]]:
        """Fetch top N prices from CoinGecko API"""
        try:
            url = f"{self.base_url}/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": top_n,
                "page": 1,
                "sparkline": "false"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                # Each item: {id, symbol, name, current_price, ...}
                prices = [
                    {
                        "symbol": item["symbol"].upper(),
                        "name": item["name"],
                        "price": item["current_price"]
                    }
                    for item in data
                ]
                if not prices:
                    logger.error("No prices received from API")
                    return None
                logger.info(
                    f"Fetched {len(prices)} crypto prices from CoinGecko")
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

    async def get_crypto_historical_data(self, coin_id: str, days: str = "1") -> Optional[Dict]:
        """Get historical price data for a cryptocurrency"""
        try:
            url = f"{self.base_url}/coins/{coin_id}/market_chart"
            params = {
                "vs_currency": "usd",
                "days": days
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                # Extract prices and format them
                prices = data.get("prices", [])
                formatted_data = {
                    "prices": [
                        {
                            "timestamp": price[0],
                            "price": price[1]
                        }
                        for price in prices
                    ]
                }

                logger.info(
                    f"Fetched historical data for {coin_id} ({days} days)")
                return formatted_data

        except httpx.TimeoutException:
            logger.error(f"CoinGecko API timeout for {coin_id}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(
                f"CoinGecko API HTTP error for {coin_id}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching historical data for {coin_id}: {e}")
            return None

    async def get_crypto_id(self, symbol: str) -> Optional[str]:
        """Get CoinGecko coin ID from symbol"""
        try:
            url = f"{self.base_url}/coins/list"

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                coins = response.json()

                # Find coin by symbol (case insensitive)
                for coin in coins:
                    if coin["symbol"].lower() == symbol.lower():
                        return coin["id"]

                return None

        except Exception as e:
            logger.error(f"Error fetching coin list: {e}")
            return None
