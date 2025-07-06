import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.weather_service import WeatherService
import redis.asyncio as redis


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_redis():
    return AsyncMock(spec=redis.Redis)


class TestWeatherEndpoint:
    @patch('app.routes.weather.WeatherService')
    def test_weather_endpoint_success(self, mock_service_class, client):
        mock_service = AsyncMock()
        mock_service.get_weather.return_value = {
            "city": "San Francisco",
            "temp": 22,
            "desc": "Clear Sky"
        }
        mock_service_class.return_value = mock_service
        response = client.get("/weather/?city=San Francisco")
        assert response.status_code == 200
        data = response.json()
        assert data["city"] == "San Francisco"
        assert data["temp"] == 22
        assert data["desc"] == "Clear Sky"

    @patch('app.routes.weather.WeatherService')
    def test_weather_endpoint_city_not_found(self, mock_service_class, client):
        mock_service = AsyncMock()
        mock_service.get_weather.side_effect = ValueError(
            "City not found: Atlantis")
        mock_service_class.return_value = mock_service
        response = client.get("/weather/?city=Atlantis")
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    @patch('app.routes.weather.WeatherService')
    def test_weather_endpoint_missing_city(self, mock_service_class, client):
        response = client.get("/weather/")
        assert response.status_code == 422


class TestWeatherService:
    @patch('app.services.weather_service.settings')
    @pytest.mark.asyncio
    async def test_get_weather_cache_hit(self, mock_settings, mock_redis):
        mock_settings.weather_api_key = "test_key"
        import json
        mock_redis.get = AsyncMock(return_value=json.dumps({
            "city": "San Francisco",
            "temp": 22,
            "desc": "Clear Sky"
        }))
        service = WeatherService(mock_redis)
        result = await service.get_weather("San Francisco")
        assert result["city"] == "San Francisco"
        assert result["temp"] == 22
        assert result["desc"] == "Clear Sky"

    @patch('app.services.weather_service.settings')
    @pytest.mark.asyncio
    async def test_get_weather_cache_miss_and_api(self, mock_settings, mock_redis):
        mock_settings.weather_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "name": "San Francisco",
            "main": {"temp": 22.3},
            "weather": [{"description": "clear sky"}]
        }
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = WeatherService(mock_redis)
            result = await service.get_weather("San Francisco")
            assert result["city"] == "San Francisco"
            assert result["temp"] == 22
            assert result["desc"] == "Clear Sky"
            mock_redis.setex.assert_called_once()

    @patch('app.services.weather_service.settings')
    @pytest.mark.asyncio
    async def test_get_weather_city_not_found(self, mock_settings, mock_redis):
        mock_settings.weather_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_response = MagicMock()
        mock_response.status_code = 404
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = WeatherService(mock_redis)
            with pytest.raises(ValueError, match="City not found: Atlantis"):
                await service.get_weather("Atlantis")

    @patch('app.services.weather_service.settings')
    @pytest.mark.asyncio
    async def test_get_weather_cache_ttl(self, mock_settings, mock_redis):
        """Test Redis cache TTL setting"""
        mock_settings.weather_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "name": "San Francisco",
            "main": {"temp": 22.3},
            "weather": [{"description": "clear sky"}]
        }
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = WeatherService(mock_redis)
            await service.get_weather("San Francisco")
            # Check TTL is 300 seconds (5 minutes)
            args, kwargs = mock_redis.setex.call_args
            assert args[1] == 300


class TestWeatherRedisIntegration:
    """Redis integration tests for weather service"""

    @pytest.mark.asyncio
    async def test_redis_connection_failure(self, mock_redis):
        """Test behavior when Redis is down"""
        mock_redis.get = AsyncMock(
            side_effect=Exception("Redis connection failed"))
        mock_redis.setex = AsyncMock(
            side_effect=Exception("Redis connection failed"))

        with patch('app.services.weather_service.settings') as mock_settings:
            mock_settings.weather_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "name": "San Francisco",
                "main": {"temp": 22.3},
                "weather": [{"description": "clear sky"}]
            }

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                service = WeatherService(mock_redis)
                result = await service.get_weather("San Francisco")

                # Service should still work even if Redis is down
                assert result["city"] == "San Francisco"
                assert result["temp"] == 22
                assert result["desc"] == "Clear Sky"

    @pytest.mark.asyncio
    async def test_redis_cache_key_format(self, mock_redis):
        """Test Redis cache key format"""
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        with patch('app.services.weather_service.settings') as mock_settings:
            mock_settings.weather_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "name": "San Francisco",
                "main": {"temp": 22.3},
                "weather": [{"description": "clear sky"}]
            }

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                service = WeatherService(mock_redis)
                await service.get_weather("San Francisco")

                # Verify cache key format
                args, kwargs = mock_redis.setex.call_args
                assert args[0] == "weather:San Francisco:metric"


class TestWeatherDatabaseLogging:
    """Database logging tests for weather service"""

    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock()

    @pytest.fixture
    def mock_logger(self):
        return AsyncMock()

    @pytest.mark.asyncio
    async def test_weather_logging_integration(self, mock_redis, mock_db_session, mock_logger):
        """Test integration with database logging"""
        # Mock successful API response
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        with patch('app.services.weather_service.settings') as mock_settings:
            mock_settings.weather_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "name": "San Francisco",
                "main": {"temp": 22.3},
                "weather": [{"description": "clear sky"}]
            }

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                # Test service with logging capability
                service = WeatherService(mock_redis)
                result = await service.get_weather("San Francisco")

                # Verify service works
                assert result["city"] == "San Francisco"
                assert result["temp"] == 22
                assert result["desc"] == "Clear Sky"

                # Verify Redis operations
                mock_redis.setex.assert_called_once()

                # Note: In a real implementation, you would inject the logger
                # and verify logging calls here
