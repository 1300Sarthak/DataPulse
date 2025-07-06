import httpx
import redis.asyncio as redis
import logging
from typing import List, Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class NewsService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.cache_ttl = 900  # 15 minutes
        self.api_key = settings.news_api_key

    async def get_top_headlines(self) -> List[Dict]:
        cache_key = "news:top_headlines"
        # Try cache first
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        # Fetch from API
        headlines = await self._fetch_from_api()
        if headlines:
            await self._cache_headlines(cache_key, headlines)
            return headlines
        # Fallback: return stale cache if available
        cached = await self._get_from_cache(cache_key, ignore_expiry=True)
        if cached:
            logger.warning("API failed, returning stale news cache")
            return cached
        # If no cache available, return empty list instead of failing
        logger.error(
            "API failed and no cache available, returning empty headlines")
        return []

    async def get_news_by_category(self, category: str) -> List[Dict]:
        """Get news articles by category"""
        cache_key = f"news:category:{category}"
        # Try cache first
        cached = await self._get_from_cache(cache_key)
        if cached:
            return cached
        # Fetch from API
        headlines = await self._fetch_from_api_by_category(category)
        if headlines:
            await self._cache_headlines(cache_key, headlines)
            return headlines
        # Fallback: return stale cache if available
        cached = await self._get_from_cache(cache_key, ignore_expiry=True)
        if cached:
            logger.warning(
                f"API failed, returning stale news cache for {category}")
            return cached
        # If no cache available, return empty list instead of failing
        logger.error(
            f"API failed and no cache available for {category}, returning empty headlines")
        return []

    async def _get_from_cache(self, cache_key: str, ignore_expiry: bool = False) -> Optional[List[Dict]]:
        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                import json
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Error reading from cache: {e}")
            return None

    async def _cache_headlines(self, cache_key: str, headlines: List[Dict]):
        try:
            import json
            await self.redis_client.setex(cache_key, self.cache_ttl, json.dumps(headlines))
        except Exception as e:
            logger.error(f"Error caching news: {e}")

    async def _fetch_from_api(self) -> Optional[List[Dict]]:
        if not self.api_key:
            logger.error("GNews API key not configured")
            return None
        url = "https://gnews.io/api/v4/top-headlines"
        params = {"lang": "en", "token": self.api_key}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 429:
                    logger.error("GNews API rate limit exceeded")
                    return None
                resp.raise_for_status()
                data = resp.json()
                articles = data.get("articles", [])[:5]
                return [
                    {
                        "title": a["title"],
                        "source": a["source"]["name"],
                        "url": a["url"],
                        "publishedAt": a["publishedAt"],
                        "image": a.get("image")
                    }
                    for a in articles
                ]
        except Exception as e:
            logger.error(f"GNews API error: {e}")
            return None

    async def _fetch_from_api_by_category(self, category: str) -> Optional[List[Dict]]:
        """Fetch news articles by category from GNews API"""
        if not self.api_key:
            logger.error("GNews API key not configured")
            return None

        # Map categories to GNews topics
        category_mapping = {
            "business": "business",
            "technology": "technology",
            "sports": "sports",
            "entertainment": "entertainment",
            "health": "health",
            "science": "science"
        }

        topic = category_mapping.get(category.lower(), "general")
        url = "https://gnews.io/api/v4/top-headlines"
        params = {
            "lang": "en",
            "topic": topic,
            "token": self.api_key,
            "max": 10  # Get more articles for carousel
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 429:
                    logger.error("GNews API rate limit exceeded")
                    return None
                resp.raise_for_status()
                data = resp.json()

                # Check for API errors (like rate limiting)
                if "errors" in data:
                    error_msg = data["errors"][0] if data["errors"] else "Unknown API error"
                    logger.error(
                        f"GNews API error for category {category}: {error_msg}")
                    return None

                articles = data.get("articles", [])
                return [
                    {
                        "title": a["title"],
                        "source": a["source"]["name"],
                        "url": a["url"],
                        "publishedAt": a["publishedAt"],
                        "image": a.get("image"),
                        "description": a.get("description", ""),
                        "category": category
                    }
                    for a in articles
                ]
        except Exception as e:
            logger.error(f"GNews API error for category {category}: {e}")
            return None
