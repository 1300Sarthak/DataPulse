from fastapi import APIRouter, Depends, HTTPException
import redis.asyncio as redis
from app.cache import get_redis
from app.services.crypto_service import CryptoService
from app.services.stocks_service import StocksService
from app.services.weather_service import WeatherService
from app.services.news_service import NewsService
from app.services.exchange_rate_service import ExchangeRateService

router = APIRouter(prefix="/refresh", tags=["refresh"])


@router.post("/")
async def refresh_all_data(
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Refresh all cached data by clearing cache and triggering fresh API calls.
    Returns success status for each service.
    """
    try:
        results = {}

        # Refresh crypto data
        try:
            crypto_service = CryptoService(redis_client)
            await crypto_service.clear_cache()
            await crypto_service.get_crypto_prices()
            results["crypto"] = "success"
        except Exception as e:
            results["crypto"] = f"error: {str(e)}"

        # Refresh stocks data (AAPL as default)
        try:
            stocks_service = StocksService(redis_client)
            await stocks_service.clear_cache()
            await stocks_service.get_stock_price("AAPL")
            results["stocks"] = "success"
        except Exception as e:
            results["stocks"] = f"error: {str(e)}"

        # Refresh weather data (New York as default)
        try:
            weather_service = WeatherService(redis_client)
            await weather_service.clear_cache()
            await weather_service.get_weather("New York")
            results["weather"] = "success"
        except Exception as e:
            results["weather"] = f"error: {str(e)}"

        # Refresh news data
        try:
            news_service = NewsService(redis_client)
            await news_service.clear_cache()
            await news_service.get_top_headlines()
            results["news"] = "success"
        except Exception as e:
            results["news"] = f"error: {str(e)}"

        # Refresh exchange rates
        try:
            exchange_service = ExchangeRateService(redis_client)
            await exchange_service.clear_cache()
            await exchange_service.get_usd_rates()
            results["exchange"] = "success"
        except Exception as e:
            results["exchange"] = f"error: {str(e)}"

        return {
            "message": "Data refresh completed",
            "results": results,
            "timestamp": "2024-01-01T00:00:00Z"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Refresh failed: {str(e)}"
        )
