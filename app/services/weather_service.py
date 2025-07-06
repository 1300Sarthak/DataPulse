import httpx
import redis.asyncio as redis
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


class WeatherService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.cache_ttl = 300  # 5 minutes
        # Try multiple possible API key sources
        self.api_key = (
            settings.weather_api_key or
            settings.openweather_api_key or
            settings.vite_openweather_api_key
        )

    async def get_weather(self, city: str, unit: str = "metric") -> dict:
        if not city:
            raise ValueError("Missing city parameter")
        city = city.strip().title()
        cache_key = f"weather:{city}:{unit}"
        # Try cache first
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        # Fetch from API
        weather = await self._fetch_from_api(city, unit)
        if weather:
            await self._cache_weather(cache_key, weather)
            return weather
        raise Exception(f"Unable to fetch weather for {city}")

    async def _get_from_cache(self, cache_key: str) -> Optional[dict]:
        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                import json
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Error reading from cache: {e}")
            return None

    async def _cache_weather(self, cache_key: str, weather: dict):
        try:
            import json
            await self.redis_client.setex(cache_key, self.cache_ttl, json.dumps(weather))
        except Exception as e:
            logger.error(f"Error caching weather: {e}")

    async def _fetch_from_api(self, city: str, unit: str = "metric") -> Optional[dict]:
        if not self.api_key:
            raise Exception("OpenWeather API key not configured")
        url = "https://api.openweathermap.org/data/2.5/weather"
        # Map frontend units to OpenWeather units
        openweather_unit = "imperial" if unit == "F" else "metric"
        params = {"q": city, "appid": self.api_key, "units": openweather_unit}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 404:
                    raise ValueError(f"City not found: {city}")
                resp.raise_for_status()
                data = resp.json()
                logger.info(
                    f"OpenWeather response for {city} with unit {unit}: {data}")
                return {
                    "city": data["name"],
                    "temp": round(data["main"]["temp"]),
                    "desc": data["weather"][0]["description"].title(),
                    "icon": data["weather"][0]["icon"],
                    "humidity": data["main"]["humidity"],
                    "wind_speed": data["wind"]["speed"],
                    "feels_like": round(data["main"]["feels_like"]),
                    "pressure": data["main"]["pressure"],
                    # Convert to km
                    "visibility": data.get("visibility", 10000) / 1000
                }
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"OpenWeather API error: {e}")
            raise Exception(f"API request failed: {e}")
