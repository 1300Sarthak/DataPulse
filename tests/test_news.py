import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.news_service import NewsService
import redis.asyncio as redis


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_redis():
    return AsyncMock(spec=redis.Redis)


class TestNewsEndpoint:
    @patch('app.routes.news.NewsService')
    def test_news_endpoint_success(self, mock_service_class, client):
        mock_service = AsyncMock()
        mock_service.get_top_headlines.return_value = [
            {"title": "Headline 1", "source": "Source 1",
                "url": "http://1", "publishedAt": "2024-06-01T12:00:00Z"},
            {"title": "Headline 2", "source": "Source 2",
                "url": "http://2", "publishedAt": "2024-06-01T13:00:00Z"},
        ]
        mock_service_class.return_value = mock_service
        response = client.get("/news/")
        assert response.status_code == 200
        data = response.json()
        assert data[0]["title"] == "Headline 1"
        assert data[1]["source"] == "Source 2"

    @patch('app.routes.news.NewsService')
    def test_news_endpoint_api_error(self, mock_service_class, client):
        mock_service = AsyncMock()
        mock_service.get_top_headlines.side_effect = Exception("API error")
        mock_service_class.return_value = mock_service
        response = client.get("/news/")
        assert response.status_code == 503
        assert "Unable to fetch news" in response.json()["detail"]


class TestNewsService:
    @patch('app.services.news_service.settings')
    @pytest.mark.asyncio
    async def test_get_news_cache_hit(self, mock_settings, mock_redis):
        mock_settings.news_api_key = "test_key"
        import json
        mock_redis.get = AsyncMock(return_value=json.dumps([
            {"title": "Headline 1", "source": "Source 1",
                "url": "http://1", "publishedAt": "2024-06-01T12:00:00Z"}
        ]))
        service = NewsService(mock_redis)
        result = await service.get_top_headlines()
        assert result[0]["title"] == "Headline 1"

    @patch('app.services.news_service.settings')
    @pytest.mark.asyncio
    async def test_get_news_cache_miss_and_api(self, mock_settings, mock_redis):
        mock_settings.news_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "articles": [
                {"title": "Headline 1", "source": {"name": "Source 1"},
                    "url": "http://1", "publishedAt": "2024-06-01T12:00:00Z"},
                {"title": "Headline 2", "source": {"name": "Source 2"},
                    "url": "http://2", "publishedAt": "2024-06-01T13:00:00Z"},
            ]
        }
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = NewsService(mock_redis)
            result = await service.get_top_headlines()
            assert result[0]["title"] == "Headline 1"
            assert result[1]["source"] == "Source 2"
            mock_redis.setex.assert_called_once()

    @patch('app.services.news_service.settings')
    @pytest.mark.asyncio
    async def test_get_news_api_rate_limit(self, mock_settings, mock_redis):
        mock_settings.news_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_response = MagicMock()
        mock_response.status_code = 429
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = NewsService(mock_redis)
            result = await service.get_top_headlines()
            assert result == []  # Should return empty list when API fails and no cache

    @patch('app.services.news_service.settings')
    @pytest.mark.asyncio
    async def test_get_news_fallback_to_stale_cache(self, mock_settings, mock_redis):
        mock_settings.news_api_key = "test_key"
        import json
        # First get returns None, second returns stale cache
        mock_redis.get = AsyncMock(side_effect=[None, json.dumps([
            {"title": "Stale Headline", "source": "Stale Source",
                "url": "http://stale", "publishedAt": "2024-06-01T10:00:00Z"}
        ])])
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.side_effect = Exception("API error")
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = NewsService(mock_redis)
            result = await service.get_top_headlines()
            assert result[0]["title"] == "Stale Headline"

    @patch('app.services.news_service.settings')
    @pytest.mark.asyncio
    async def test_get_news_cache_ttl(self, mock_settings, mock_redis):
        """Test Redis cache TTL setting"""
        mock_settings.news_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "articles": [
                {"title": "Headline 1", "source": {"name": "Source 1"},
                    "url": "http://1", "publishedAt": "2024-06-01T12:00:00Z"}
            ]
        }
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = NewsService(mock_redis)
            await service.get_top_headlines()
            # Check TTL is 900 seconds (15 minutes)
            args, kwargs = mock_redis.setex.call_args
            assert args[1] == 900


class TestNewsRedisIntegration:
    """Redis integration tests for news service"""

    @pytest.mark.asyncio
    async def test_redis_connection_failure(self, mock_redis):
        """Test behavior when Redis is down"""
        mock_redis.get = AsyncMock(
            side_effect=Exception("Redis connection failed"))
        mock_redis.setex = AsyncMock(
            side_effect=Exception("Redis connection failed"))

        with patch('app.services.news_service.settings') as mock_settings:
            mock_settings.news_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "articles": [
                    {"title": "Headline 1", "source": {"name": "Source 1"},
                        "url": "http://1", "publishedAt": "2024-06-01T12:00:00Z"}
                ]
            }

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                service = NewsService(mock_redis)
                result = await service.get_top_headlines()

                # Service should still work even if Redis is down
                assert result[0]["title"] == "Headline 1"

    @pytest.mark.asyncio
    async def test_redis_cache_key_format(self, mock_redis):
        """Test Redis cache key format"""
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        with patch('app.services.news_service.settings') as mock_settings:
            mock_settings.news_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "articles": [
                    {"title": "Headline 1", "source": {"name": "Source 1"},
                        "url": "http://1", "publishedAt": "2024-06-01T12:00:00Z"}
                ]
            }

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                service = NewsService(mock_redis)
                await service.get_top_headlines()

                # Verify cache key format
                args, kwargs = mock_redis.setex.call_args
                assert args[0] == "news:top_headlines"


class TestNewsDatabaseLogging:
    """Database logging tests for news service"""

    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock()

    @pytest.fixture
    def mock_logger(self):
        return AsyncMock()

    @pytest.mark.asyncio
    async def test_news_logging_integration(self, mock_redis, mock_db_session, mock_logger):
        """Test integration with database logging"""
        # Mock successful API response
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        with patch('app.services.news_service.settings') as mock_settings:
            mock_settings.news_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "articles": [
                    {"title": "Headline 1", "source": {"name": "Source 1"},
                        "url": "http://1", "publishedAt": "2024-06-01T12:00:00Z"}
                ]
            }

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                # Test service with logging capability
                service = NewsService(mock_redis)
                result = await service.get_top_headlines()

                # Verify service works
                assert result[0]["title"] == "Headline 1"

                # Verify Redis operations
                mock_redis.setex.assert_called_once()

                # Note: In a real implementation, you would inject the logger
                # and verify logging calls here
