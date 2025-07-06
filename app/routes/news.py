from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import redis.asyncio as redis
from app.cache import get_redis
from app.services.news_service import NewsService
from typing import List, Optional
from datetime import datetime, timedelta, timezone


class NewsHeadline(BaseModel):
    title: str
    source: str
    url: str
    publishedAt: str
    image: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


router = APIRouter(prefix="/news", tags=["news"])


def filter_by_time_range(articles, time_range):
    if not time_range:
        return articles
    now = datetime.now(timezone.utc)
    if time_range == "1h":
        cutoff = now - timedelta(hours=1)
    elif time_range == "24h":
        cutoff = now - timedelta(hours=24)
    elif time_range == "7d":
        cutoff = now - timedelta(days=7)
    elif time_range == "30d":
        cutoff = now - timedelta(days=30)
    else:
        return articles
    filtered = [a for a in articles if a.get("publishedAt") and datetime.fromisoformat(
        a["publishedAt"].replace("Z", "+00:00")) >= cutoff]
    return filtered


@router.get("/", response_model=List[NewsHeadline])
async def get_news(
    time_range: Optional[str] = Query(
        None, description="Time range: 1h, 24h, 7d, 30d"),
    redis_client: redis.Redis = Depends(get_redis)
) -> List[NewsHeadline]:
    """
    Get top 5 news headlines from GNews. Caches result for 15 minutes.
    Optionally filter by time range.
    """
    try:
        service = NewsService(redis_client)
        headlines = await service.get_top_headlines()
        filtered = filter_by_time_range(headlines, time_range)
        return [NewsHeadline(**h) for h in filtered]
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Unable to fetch news: {e}")


@router.get("/category/{category}", response_model=List[NewsHeadline])
async def get_news_by_category(
    category: str,
    redis_client: redis.Redis = Depends(get_redis)
) -> List[NewsHeadline]:
    """
    Get news headlines by category from GNews. 
    Available categories: business, technology, sports, entertainment, health, science
    Caches result for 15 minutes.
    """
    try:
        service = NewsService(redis_client)
        headlines = await service.get_news_by_category(category)
        return [NewsHeadline(**h) for h in headlines]
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Unable to fetch news for category {category}: {e}")
