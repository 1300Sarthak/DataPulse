import httpx
import redis.asyncio as redis
import json
import logging
from typing import Optional, Dict
from app.config import settings

logger = logging.getLogger(__name__)


class StocksService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.cache_ttl = 60  # 1 minute
        # Use resolved API key
        self.finnhub_key = settings.stocks_api_key_resolved

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

    async def get_stock_historical_data(self, symbol: str, resolution: str = "1", from_timestamp: int = None, to_timestamp: int = None) -> Optional[Dict]:
        """Get historical price data for a stock"""
        if not self.finnhub_key:
            raise Exception("Finnhub API key not configured")

        # Set default time range if not provided (last 24 hours)
        if from_timestamp is None:
            import time
            to_timestamp = int(time.time())
            from_timestamp = to_timestamp - (24 * 60 * 60)  # 24 hours ago

        url = "https://finnhub.io/api/v1/stock/candle"
        params = {
            "symbol": symbol,
            "resolution": resolution,
            "from": from_timestamp,
            "to": to_timestamp,
            "token": self.finnhub_key
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code == 403:
                    logger.error("Finnhub API rate limit exceeded")
                    raise Exception("API rate limit exceeded")

                response.raise_for_status()
                data = response.json()

                if data.get("s") == "ok" and data.get("t"):
                    # Format the data
                    formatted_data = {
                        "prices": [
                            {
                                # Convert to milliseconds
                                "timestamp": data["t"][i] * 1000,
                                "open": data["o"][i],
                                "high": data["h"][i],
                                "low": data["l"][i],
                                "close": data["c"][i],
                                "volume": data["v"][i]
                            }
                            for i in range(len(data["t"]))
                        ]
                    }
                    logger.info(f"Fetched historical data for {symbol}")
                    return formatted_data
                else:
                    logger.error(
                        f"Invalid response format for {symbol}: {data}")
                    return None

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                logger.error("Finnhub API rate limit exceeded")
                raise Exception("API rate limit exceeded")
            else:
                logger.error(f"Finnhub API HTTP error: {e}")
                return None
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            return None

    async def get_mock_historical_data(self, symbol: str, period: str = "1D") -> Dict:
        """Generate mock historical data for testing/demo purposes"""
        import time
        import random

        # Define time periods in seconds
        periods = {
            "1H": 60 * 60,  # 1 hour
            "1D": 24 * 60 * 60,  # 1 day
            "1W": 7 * 24 * 60 * 60,  # 1 week
            "1M": 30 * 24 * 60 * 60,  # 1 month
            "3M": 90 * 24 * 60 * 60,  # 3 months
            "1Y": 365 * 24 * 60 * 60,  # 1 year
            "5Y": 5 * 365 * 24 * 60 * 60,  # 5 years
        }

        if period not in periods:
            period = "1D"  # Default to 1 day

        # Generate timestamps
        current_time = int(time.time())
        from_timestamp = current_time - periods[period]

        # Generate mock price data with some realistic variation
        base_price = 200  # Base price for stocks
        if symbol.upper() in ["AAPL", "APPLE"]:
            base_price = 200
        elif symbol.upper() in ["GOOGL", "GOOGLE"]:
            base_price = 150
        elif symbol.upper() in ["MSFT", "MICROSOFT"]:
            base_price = 400
        elif symbol.upper() in ["TSLA", "TESLA"]:
            base_price = 250
        elif symbol.upper() in ["AMZN", "AMAZON"]:
            base_price = 180

        prices = []
        current_price = base_price

        # Generate data points based on period
        # Max 100 points, 1 per hour minimum
        num_points = min(100, periods[period] // 3600)

        for i in range(num_points):
            timestamp = from_timestamp + (i * periods[period] // num_points)

            # Add some random variation
            variation = random.uniform(-0.03, 0.03)  # ±3% variation
            current_price = current_price * (1 + variation)

            prices.append({
                "timestamp": timestamp * 1000,  # Convert to milliseconds
                "open": round(current_price * 0.99, 2),
                "high": round(current_price * 1.02, 2),
                "low": round(current_price * 0.98, 2),
                "close": round(current_price, 2),
                "volume": random.randint(1000000, 10000000)
            })

        logger.info(f"Generated mock historical data for {symbol} ({period})")
        return {"prices": prices}

    async def get_stock_historical_data_by_period(self, symbol: str, period: str = "1D") -> Optional[Dict]:
        """Get historical data for common time periods"""
        import time

        current_time = int(time.time())

        # Define time periods in seconds
        periods = {
            "1H": 60 * 60,  # 1 hour
            "1D": 24 * 60 * 60,  # 1 day
            "1W": 7 * 24 * 60 * 60,  # 1 week
            "1M": 30 * 24 * 60 * 60,  # 1 month
            "3M": 90 * 24 * 60 * 60,  # 3 months
            "1Y": 365 * 24 * 60 * 60,  # 1 year
            "5Y": 5 * 365 * 24 * 60 * 60,  # 5 years
        }

        if period not in periods:
            raise ValueError(
                f"Invalid period: {period}. Available: {list(periods.keys())}")

        # Set resolution based on period
        resolutions = {
            "1H": "1",  # 1 minute
            "1D": "5",  # 5 minutes
            "1W": "30",  # 30 minutes
            "1M": "D",  # Daily
            "3M": "D",  # Daily
            "1Y": "D",  # Daily
            "5Y": "D",  # Daily
        }

        from_timestamp = current_time - periods[period]
        resolution = resolutions[period]

        return await self.get_stock_historical_data(symbol, resolution, from_timestamp, current_time)
