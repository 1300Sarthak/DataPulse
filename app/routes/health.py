from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from app.database import get_db
from app.cache import get_redis
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check(
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """Health check endpoint"""
    health_service = HealthService(db, redis_client)
    return await health_service.check_health()
