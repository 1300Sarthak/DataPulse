import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.services.crypto_service import CryptoService


class TestCryptoService:
    """Unit tests for CryptoService"""

    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client"""
        return AsyncMock()

    @pytest.fixture
    def crypto_service(self, mock_redis):
        """CryptoService instance with mocked Redis"""
        return CryptoService(mock_redis)

    @pytest.mark.asyncio
    async def test_get_crypto_prices_from_cache(self, crypto_service, mock_redis):
        """Test returning cached prices"""
        # Mock cached data
        cached_prices = {"BTC": 50000.0, "ETH": 3000.0}
        mock_redis.get.return_value = json.dumps(cached_prices)

        result = await crypto_service.get_crypto_prices()

        assert result == cached_prices
        mock_redis.get.assert_called_once_with("crypto_prices")

    @pytest.mark.asyncio
    async def test_get_crypto_prices_from_api(self, crypto_service, mock_redis):
        """Test fetching prices from API when cache is empty"""
        # Mock empty cache
        mock_redis.get.return_value = None

        # Mock API response
        api_response = {
            "bitcoin": {"usd": 50000.0},
            "ethereum": {"usd": 3000.0}
        }

        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = api_response
            mock_response.raise_for_status.return_value = None

            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value = mock_client_instance

            result = await crypto_service.get_crypto_prices()

            expected = {"BTC": 50000.0, "ETH": 3000.0}
            assert result == expected

            # Verify cache was set
            mock_redis.setex.assert_called_once()
            call_args = mock_redis.setex.call_args
            assert call_args[0][0] == "crypto_prices"  # key
            assert call_args[0][1] == 60  # ttl
            cached_data = json.loads(call_args[0][2])  # value
            assert cached_data == expected

    @pytest.mark.asyncio
    async def test_get_crypto_prices_api_timeout(self, crypto_service, mock_redis):
        """Test handling API timeout"""
        # Mock empty cache
        mock_redis.get.return_value = None

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client_instance.get.side_effect = httpx.TimeoutException(
                "Timeout")
            mock_client.return_value = mock_client_instance

            # Should raise exception when no cached data available
            with pytest.raises(Exception, match="API unavailable and no cached data"):
                await crypto_service.get_crypto_prices()

    @pytest.mark.asyncio
    async def test_get_crypto_prices_fallback_to_stale_cache(self, crypto_service, mock_redis):
        """Test falling back to stale cache when API fails"""
        # Mock stale cached data (first call returns None, second returns data)
        stale_prices = {"BTC": 50000.0, "ETH": 3000.0}
        mock_redis.get.side_effect = [None, json.dumps(stale_prices)]

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client_instance.get.side_effect = httpx.TimeoutException(
                "Timeout")
            mock_client.return_value = mock_client_instance

            result = await crypto_service.get_crypto_prices()

            assert result == stale_prices

    @pytest.mark.asyncio
    async def test_get_crypto_prices_invalid_api_response(self, crypto_service, mock_redis):
        """Test handling invalid API response"""
        # Mock empty cache
        mock_redis.get.return_value = None

        # Mock invalid API response (missing prices)
        api_response = {"bitcoin": {"usd": 0.0}, "ethereum": {"usd": 3000.0}}

        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = api_response
            mock_response.raise_for_status.return_value = None

            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value = mock_client_instance

            # Should raise exception when no cached data available
            with pytest.raises(Exception, match="API unavailable and no cached data"):
                await crypto_service.get_crypto_prices()


class TestCryptoEndpoint:
    """Integration tests for crypto endpoint"""

    @pytest.fixture
    def client(self):
        """Test client"""
        return TestClient(app)

    @patch('app.routes.crypto.CryptoService')
    def test_crypto_endpoint_success(self, mock_crypto_service_class, client):
        """Test successful crypto endpoint response"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.get_crypto_prices.return_value = {
            "BTC": 50000.0, "ETH": 3000.0}
        mock_crypto_service_class.return_value = mock_service

        response = client.get("/crypto/")

        assert response.status_code == 200
        data = response.json()
        assert data == {"BTC": 50000.0, "ETH": 3000.0}
        assert "BTC" in data
        assert "ETH" in data
        assert isinstance(data["BTC"], float)
        assert isinstance(data["ETH"], float)

    @patch('app.routes.crypto.CryptoService')
    def test_crypto_endpoint_service_error(self, mock_crypto_service_class, client):
        """Test crypto endpoint error handling"""
        # Mock service error
        mock_service = AsyncMock()
        mock_service.get_crypto_prices.side_effect = Exception("Service error")
        mock_crypto_service_class.return_value = mock_service

        response = client.get("/crypto/")

        assert response.status_code == 503
        data = response.json()
        assert "detail" in data
        assert "Unable to fetch crypto prices" in data["detail"]


@pytest.mark.asyncio
async def test_crypto_service_cache_operations():
    """Test Redis cache operations"""
    # This test requires a real Redis connection
    # In a real environment, you might use a test Redis instance
    import redis.asyncio as redis

    # Mock Redis for this test
    mock_redis = AsyncMock()

    # Test caching
    service = CryptoService(mock_redis)
    prices = {"BTC": 50000.0, "ETH": 3000.0}

    await service._cache_prices(prices)

    # Verify setex was called with correct parameters
    mock_redis.setex.assert_called_once()
    call_args = mock_redis.setex.call_args
    assert call_args[0][0] == "crypto_prices"  # key
    assert call_args[0][1] == 60  # ttl
    cached_data = json.loads(call_args[0][2])  # value
    assert cached_data == prices

    # Test cache retrieval
    mock_redis.get.return_value = json.dumps(prices)
    result = await service._get_from_cache()
    assert result == prices
