import redis.asyncio as redis
from .config import settings

# Create Redis client
try:
    redis_client = redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True
    )
except Exception as e:
    print(f"Warning: Redis connection failed: {e}")
    redis_client = None


async def get_redis():
    """Dependency to get Redis client"""
    if redis_client is None:
        raise Exception("Redis client not available")
    return redis_client


async def close_redis():
    """Close Redis connection"""
    if redis_client:
        await redis_client.close()
