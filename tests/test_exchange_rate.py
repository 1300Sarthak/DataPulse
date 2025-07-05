import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.exchange_rate_service import ExchangeRateService
import redis.asyncio as redis


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_redis():
    return AsyncMock(spec=redis.Redis)


class TestExchangeRateEndpoint:
    @patch('app.routes.exchange_rate.ExchangeRateService')
    def test_exchange_rate_endpoint_success(self, mock_service_class, client):
        mock_service = AsyncMock()
        mock_service.get_usd_rates.return_value = {
            "USD_EUR": 0.92, "USD_INR": 83.13}
        mock_service_class.return_value = mock_service
        response = client.get("/exchange-rate/")
        assert response.status_code == 200
        data = response.json()
        assert "USD_EUR" in data and "USD_INR" in data
        assert data["USD_EUR"] == 0.92
        assert data["USD_INR"] == 83.13

    @patch('app.routes.exchange_rate.ExchangeRateService')
    def test_exchange_rate_endpoint_unavailable(self, mock_service_class, client):
        mock_service = AsyncMock()
        mock_service.get_usd_rates.return_value = {}
        mock_service_class.return_value = mock_service
        response = client.get("/exchange-rate/")
        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"]


class TestExchangeRateService:
    @patch('app.services.exchange_rate_service.settings')
    @pytest.mark.asyncio
    async def test_get_usd_rates_cache_hit(self, mock_settings, mock_redis):
        mock_settings.exchange_api_key = "test_key"
        import json
        mock_redis.get = AsyncMock(return_value=json.dumps(
            {"USD_EUR": 0.92, "USD_INR": 83.13}))
        service = ExchangeRateService(mock_redis)
        result = await service.get_usd_rates()
        assert result["USD_EUR"] == 0.92
        assert result["USD_INR"] == 83.13

    @patch('app.services.exchange_rate_service.settings')
    @pytest.mark.asyncio
    async def test_get_usd_rates_cache_miss_and_api(self, mock_settings, mock_redis):
        mock_settings.exchange_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversion_rates": {"EUR": 0.92, "INR": 83.13}
        }
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = ExchangeRateService(mock_redis)
            result = await service.get_usd_rates()
            assert result["USD_EUR"] == 0.92
            assert result["USD_INR"] == 83.13
            mock_redis.setex.assert_called_once()

    @patch('app.services.exchange_rate_service.settings')
    @pytest.mark.asyncio
    async def test_get_usd_rates_api_rate_limit(self, mock_settings, mock_redis):
        mock_settings.exchange_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_response = MagicMock()
        mock_response.status_code = 429
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = ExchangeRateService(mock_redis)
            result = await service.get_usd_rates()
            assert result == {}

    @patch('app.services.exchange_rate_service.settings')
    @pytest.mark.asyncio
    async def test_get_usd_rates_cache_ttl(self, mock_settings, mock_redis):
        mock_settings.exchange_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversion_rates": {"EUR": 0.92, "INR": 83.13}
        }
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            service = ExchangeRateService(mock_redis)
            await service.get_usd_rates()
            # Check TTL is 21600 seconds (6 hours)
            args, kwargs = mock_redis.setex.call_args
            assert args[1] == 21600
