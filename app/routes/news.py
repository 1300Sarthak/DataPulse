from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import redis.asyncio as redis
from app.cache import get_redis
from app.services.news_service import NewsService
from typing import List


from typing import Optional

class NewsHeadline(BaseModel):
    title: str
    source: str
    url: str
    publishedAt: str
    image: Optional[str] = None


router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=List[NewsHeadline])
async def get_news(
    redis_client: redis.Redis = Depends(get_redis)
) -> List[NewsHeadline]:
    """
    Get top 5 news headlines from GNews. Caches result for 15 minutes.
    """
    try:
        service = NewsService(redis_client)
        headlines = await service.get_top_headlines()
        return [NewsHeadline(**h) for h in headlines]
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Unable to fetch news: {e}")
