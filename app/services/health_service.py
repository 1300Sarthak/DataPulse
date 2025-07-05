from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from typing import Dict, Any
from app.services.supabase_service import supabase_service


class HealthService:
    def __init__(self, db: AsyncSession, redis_client: redis.Redis):
        self.db = db
        self.redis_client = redis_client

    async def check_health(self) -> Dict[str, Any]:
        """Check health of all services"""
        return {
            "status": "healthy",
            "database": await self._check_database(),
            "redis": await self._check_redis(),
            "supabase": await self._check_supabase(),
            "timestamp": "2024-01-01T00:00:00Z"
        }

    async def _check_database(self) -> Dict[str, Any]:
        """Check database connection"""
        try:
            # Simple query to test connection
            from sqlalchemy import text
            result = await self.db.execute(text("SELECT 1"))
            await result.fetchone()
            return {"status": "healthy", "message": "Database connection successful"}
        except Exception as e:
            return {"status": "unhealthy", "message": f"Database connection failed: {str(e)}"}

    async def _check_redis(self) -> Dict[str, Any]:
        """Check Redis connection"""
        try:
            if self.redis_client is None:
                return {"status": "unhealthy", "message": "Redis client not available"}
            await self.redis_client.ping()
            return {"status": "healthy", "message": "Redis connection successful"}
        except Exception as e:
            return {"status": "unhealthy", "message": f"Redis connection failed: {str(e)}"}

    async def _check_supabase(self) -> Dict[str, Any]:
        """Check Supabase connection"""
        try:
            client = supabase_service.get_client()
            if client is None:
                return {"status": "unhealthy", "message": "Supabase client not available"}

            # Test connection by making a simple query
            response = client.table("_dummy_table_").select(
                "*").limit(1).execute()
            return {"status": "healthy", "message": "Supabase connection successful"}
        except Exception as e:
            # If table doesn't exist, that's fine - it means connection works
            if "relation" in str(e).lower() and "does not exist" in str(e).lower():
                return {"status": "healthy", "message": "Supabase connection successful (no test table)"}
            return {"status": "unhealthy", "message": f"Supabase connection failed: {str(e)}"}
