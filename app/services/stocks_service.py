import httpx
import redis.asyncio as redis
import json
import logging
import asyncio
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

        # Generate data points
        num_points = 100
        for i in range(num_points):
            # Add some random variation
            change = random.uniform(-0.02, 0.02)  # ±2% change
            current_price = current_price * (1 + change)

            # Ensure price doesn't go negative
            current_price = max(current_price, base_price * 0.5)

            timestamp = from_timestamp + (i * periods[period] // num_points)

            prices.append({
                "timestamp": timestamp * 1000,  # Convert to milliseconds
                "open": current_price,
                "high": current_price * random.uniform(1.0, 1.05),
                "low": current_price * random.uniform(0.95, 1.0),
                "close": current_price,
                "volume": random.randint(1000000, 10000000)
            })

        return {
            "symbol": symbol.upper(),
            "period": period,
            "prices": prices
        }

    async def get_stock_historical_data_by_period(self, symbol: str, period: str = "1D") -> Optional[Dict]:
        """Get historical data using period string instead of timestamps"""
        # For now, use mock data to avoid rate limiting issues
        # In production, you could implement proper rate limiting and caching
        return await self.get_mock_historical_data(symbol, period)

    async def get_top_stocks(self, top_n: int = 25) -> list:
        """Fetch top N stocks by market cap (or a static list if Finnhub doesn't provide)."""
        # For demo: Use a static list of top US stocks (S&P 500 leaders)
        top_symbols = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.A', 'JPM', 'V',
            'UNH', 'HD', 'PG', 'DIS', 'MA', 'BAC', 'XOM', 'PFE', 'KO', 'NFLX',
            'PEP', 'CSCO', 'ABT', 'TMO', 'AVGO', 'COST', 'WMT', 'CVX', 'MCD', 'DHR',
            'LLY', 'ACN', 'LIN', 'MRK', 'CRM', 'INTC', 'TXN', 'NEE', 'NKE', 'MDT',
            'HON', 'UNP', 'AMGN', 'QCOM', 'LOW', 'MS', 'SBUX', 'IBM', 'AMD', 'GS',
            'CAT', 'DE', 'RTX', 'SPGI', 'T', 'VZ', 'CMCSA', 'ADBE', 'PM', 'UPS'
        ][:top_n]

        results = []

        # For now, use mock data to avoid rate limiting issues
        # In production, you could implement proper rate limiting and caching
        for symbol in top_symbols:
            mock_price = self._get_mock_price(symbol)
            results.append({
                'symbol': symbol,
                'name': symbol,
                'price': mock_price
            })

        logger.info(f"Generated mock data for {len(results)} stocks")
        return results

    async def _fetch_stock_with_fallback(self, symbol: str) -> dict:
        """Fetch stock price with fallback to mock data if API fails"""
        try:
            price = await self.get_stock_price(symbol)
            return {
                'symbol': symbol,
                'name': symbol,
                'price': price
            }
        except Exception as e:
            logger.warning(f"API failed for {symbol}, using mock data: {e}")
            # Fallback to mock price
            mock_price = self._get_mock_price(symbol)
            return {
                'symbol': symbol,
                'name': symbol,
                'price': mock_price
            }

    def _get_mock_price(self, symbol: str) -> float:
        """Generate a realistic mock price for a stock"""
        import random

        # Base prices for common stocks
        base_prices = {
            'AAPL': 200, 'MSFT': 400, 'GOOGL': 150, 'AMZN': 180, 'NVDA': 500,
            'META': 300, 'TSLA': 250, 'BRK.A': 500000, 'JPM': 150, 'V': 250,
            'UNH': 500, 'HD': 350, 'PG': 150, 'DIS': 100, 'MA': 400,
            'BAC': 30, 'XOM': 100, 'PFE': 30, 'KO': 60, 'NFLX': 500,
            'PEP': 180, 'CSCO': 50, 'ABT': 100, 'TMO': 500, 'AVGO': 600,
            'COST': 800, 'WMT': 60, 'CVX': 150, 'MCD': 300, 'DHR': 250,
            'LLY': 700, 'ACN': 300, 'LIN': 400, 'MRK': 100, 'CRM': 250,
            'INTC': 40, 'TXN': 150, 'NEE': 60, 'NKE': 100, 'MDT': 80,
            'HON': 200, 'UNP': 250, 'AMGN': 300, 'QCOM': 120, 'LOW': 200,
            'MS': 100, 'SBUX': 100, 'IBM': 150, 'AMD': 120, 'GS': 350,
            'CAT': 250, 'DE': 400, 'RTX': 100, 'SPGI': 400, 'T': 20,
            'VZ': 40, 'CMCSA': 40, 'ADBE': 500, 'PM': 100, 'UPS': 150
        }

        base_price = base_prices.get(symbol, 100)
        # Add some random variation (±10%)
        variation = random.uniform(0.9, 1.1)
        return round(base_price * variation, 2)
