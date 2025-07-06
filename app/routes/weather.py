from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import redis.asyncio as redis
from app.cache import get_redis
from app.services.weather_service import WeatherService


class WeatherResponse(BaseModel):
    city: str
    temp: int
    desc: str


router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/", response_model=WeatherResponse)
async def get_weather(
    city: str = Query(..., description="City name, e.g. San Francisco"),
    unit: str = Query("C", description="Temperature unit: C or F"),
    redis_client: redis.Redis = Depends(get_redis)
) -> WeatherResponse:
    """
    Get weather for a city from OpenWeather. Caches result for 5 minutes.
    """
    try:
        service = WeatherService(redis_client)
        weather = await service.get_weather(city, unit)
        return WeatherResponse(**weather)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Unable to fetch weather: {e}")
