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
        self.api_key = settings.crypto_api_key_resolved

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

            # Add API key if available
            if self.api_key:
                params["x_cg_demo_api_key"] = self.api_key

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code == 429:
                    logger.error("CoinGecko API rate limit exceeded")
                    raise Exception("API rate limit exceeded")

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

    async def get_mock_historical_data(self, symbol: str, days: str = "1") -> Dict:
        """Generate mock historical data for testing/demo purposes"""
        import time
        import random

        # Convert days to number of data points
        days_int = int(days) if days.isdigit() else 1
        if days == "max":
            days_int = 365

        # Generate timestamps
        end_time = int(time.time() * 1000)  # Current time in milliseconds
        start_time = end_time - (days_int * 24 * 60 * 60 * 1000)  # days ago

        # Generate mock price data with some realistic variation
        base_price = 50000  # Base price for crypto
        if symbol.upper() in ["ETH", "ETHEREUM"]:
            base_price = 3000
        elif symbol.upper() in ["USDT", "TETHER"]:
            base_price = 1.0
        elif symbol.upper() in ["XRP"]:
            base_price = 2.0
        elif symbol.upper() in ["BNB"]:
            base_price = 600

        prices = []
        current_price = base_price

        for i in range(min(days_int * 24, 100)):  # Max 100 data points
            timestamp = start_time + \
                (i * (end_time - start_time) // min(days_int * 24, 100))

            # Add some random variation
            variation = random.uniform(-0.05, 0.05)  # ±5% variation
            current_price = current_price * (1 + variation)

            prices.append({
                "timestamp": timestamp,
                "price": round(current_price, 2)
            })

        logger.info(
            f"Generated mock historical data for {symbol} ({days} days)")
        return {"prices": prices}

    async def get_crypto_historical_data(self, coin_id: str, days: str = "1") -> Optional[Dict]:
        """Get historical price data for a cryptocurrency"""
        try:
            url = f"{self.base_url}/coins/{coin_id}/market_chart"
            params = {
                "vs_currency": "usd",
                "days": days
            }

            # Add API key if available
            if self.api_key:
                params["x_cg_demo_api_key"] = self.api_key

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code == 429:
                    logger.error("CoinGecko API rate limit exceeded")
                    raise Exception("API rate limit exceeded")

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
            if e.response.status_code == 429:
                logger.error("CoinGecko API rate limit exceeded")
                raise Exception("API rate limit exceeded")
            else:
                logger.error(
                    f"CoinGecko API HTTP error for {coin_id}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching historical data for {coin_id}: {e}")
            return None

    async def get_crypto_id(self, symbol: str) -> Optional[str]:
        """Get CoinGecko coin ID from symbol with caching"""
        try:
            logger.info(f"Looking up coin ID for symbol: {symbol}")

            # Check cache first
            cache_key = f"crypto_id:{symbol.lower()}"
            try:
                cached_id = await self.redis_client.get(cache_key)
                if cached_id:
                    logger.info(
                        f"Found cached ID for {symbol}: {cached_id.decode('utf-8')}")
                    return cached_id.decode('utf-8')
            except Exception as e:
                logger.warning(f"Redis cache check failed: {e}")

            # Fetch from API
            url = f"{self.base_url}/coins/list"
            params = {}

            # Add API key if available
            if self.api_key:
                params["x_cg_demo_api_key"] = self.api_key
                logger.info(f"Using API key for coin list request")
            else:
                logger.warning("No API key available for coin list request")

            logger.info(f"Fetching coin list from: {url}")
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code == 429:
                    logger.error("CoinGecko API rate limit exceeded")
                    raise Exception("API rate limit exceeded")

                response.raise_for_status()
                coins = response.json()
                logger.info(f"Received {len(coins)} coins from API")

                # Find coin by symbol (case insensitive)
                matching_coins = []
                for coin in coins:
                    if coin["symbol"].lower() == symbol.lower():
                        matching_coins.append(coin)

                if not matching_coins:
                    logger.warning(f"No coin found for symbol: {symbol}")
                    return None

                # If multiple matches, prioritize well-known coins
                if len(matching_coins) > 1:
                    logger.info(
                        f"Found {len(matching_coins)} coins for symbol {symbol}")

                    # Define priority names for common symbols
                    priority_names = {
                        'btc': ['bitcoin'],
                        'eth': ['ethereum'],
                        'usdt': ['tether'],
                        'usdc': ['usd coin'],
                        'bnb': ['bnb'],
                        'xrp': ['xrp'],
                        'ada': ['cardano'],
                        'sol': ['solana'],
                        'doge': ['dogecoin'],
                        'dot': ['polkadot'],
                        'avax': ['avalanche'],
                        'matic': ['polygon'],
                        'link': ['chainlink'],
                        'uni': ['uniswap'],
                        'ltc': ['litecoin'],
                        'bch': ['bitcoin cash'],
                        'etc': ['ethereum classic'],
                        'xlm': ['stellar'],
                        'atom': ['cosmos'],
                        'near': ['near protocol']
                    }

                    # Try to find the priority coin
                    priority_names_list = priority_names.get(
                        symbol.lower(), [])
                    for coin in matching_coins:
                        if coin["name"].lower() in priority_names_list:
                            logger.info(
                                f"Found priority coin for {symbol}: {coin['id']} ({coin['name']})")
                            # Cache the result for 1 hour
                            try:
                                await self.redis_client.setex(cache_key, 3600, coin["id"])
                                logger.info(f"Cached coin ID for {symbol}")
                            except Exception as e:
                                logger.warning(f"Failed to cache coin ID: {e}")
                            return coin["id"]

                    # If no priority match, log all matches and return the first one
                    logger.warning(
                        f"No priority match found for {symbol}. All matches:")
                    for coin in matching_coins:
                        logger.warning(f"  - {coin['id']} ({coin['name']})")

                # Return the first (or only) match
                selected_coin = matching_coins[0]
                logger.info(
                    f"Selected coin for {symbol}: {selected_coin['id']} ({selected_coin['name']})")

                # Cache the result for 1 hour
                try:
                    await self.redis_client.setex(cache_key, 3600, selected_coin["id"])
                    logger.info(f"Cached coin ID for {symbol}")
                except Exception as e:
                    logger.warning(f"Failed to cache coin ID: {e}")
                return selected_coin["id"]

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.error("CoinGecko API rate limit exceeded")
                raise Exception("API rate limit exceeded")
            else:
                logger.error(f"CoinGecko API HTTP error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching coin list: {e}")
            return None

    async def clear_cache(self) -> None:
        """Clear all crypto-related cache"""
        try:
            # Clear price cache
            keys = await self.redis_client.keys(f"{self.cache_key}:*")
            if keys:
                await self.redis_client.delete(*keys)

            # Clear ID cache
            id_keys = await self.redis_client.keys("crypto_id:*")
            if id_keys:
                await self.redis_client.delete(*id_keys)

            logger.info("Cleared crypto cache")
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")

    async def clear_id_cache(self) -> None:
        """Clear crypto ID cache only"""
        try:
            keys = await self.redis_client.keys("crypto_id:*")
            if keys:
                await self.redis_client.delete(*keys)
            logger.info("Cleared crypto ID cache")
        except Exception as e:
            logger.error(f"Error clearing ID cache: {e}")
