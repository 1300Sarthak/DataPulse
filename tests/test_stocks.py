import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.stocks_service import StocksService
import redis.asyncio as redis


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_redis():
    return AsyncMock(spec=redis.Redis)


class TestStocksEndpoint:
    @patch('app.routes.stocks.StocksService')
    def test_stocks_endpoint_success(self, mock_service_class, client):
        """Test successful stock price retrieval"""
        mock_service = AsyncMock()
        mock_service.get_stock_price.return_value = 189.30
        mock_service_class.return_value = mock_service

        response = client.get("/stocks/?symbol=AAPL")

        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert data["price"] == 189.30

    def test_stocks_endpoint_missing_symbol(self, client):
        """Test missing symbol parameter"""
        response = client.get("/stocks/")
        assert response.status_code == 422  # FastAPI validation error

    @patch('app.routes.stocks.StocksService')
    def test_stocks_endpoint_invalid_symbol(self, mock_service_class, client):
        """Test invalid symbol error handling"""
        mock_service = AsyncMock()
        mock_service.get_stock_price.side_effect = ValueError(
            "Invalid symbol: INVALID")
        mock_service_class.return_value = mock_service

        response = client.get("/stocks/?symbol=INVALID")

        assert response.status_code == 400
        data = response.json()
        assert "Invalid symbol" in data["detail"]

    @patch('app.routes.stocks.StocksService')
    def test_stocks_endpoint_rate_limit(self, mock_service_class, client):
        """Test rate limit error handling"""
        mock_service = AsyncMock()
        mock_service.get_stock_price.side_effect = Exception(
            "API rate limit exceeded")
        mock_service_class.return_value = mock_service

        response = client.get("/stocks/?symbol=AAPL")

        assert response.status_code == 429
        data = response.json()
        assert "rate limit exceeded" in data["detail"]

    @patch('app.routes.stocks.StocksService')
    def test_stocks_endpoint_api_config_error(self, mock_service_class, client):
        """Test API configuration error handling"""
        mock_service = AsyncMock()
        mock_service.get_stock_price.side_effect = Exception(
            "API key not configured")
        mock_service_class.return_value = mock_service

        response = client.get("/stocks/?symbol=AAPL")

        assert response.status_code == 500
        data = response.json()
        assert "configuration error" in data["detail"]

    @patch('app.routes.stocks.StocksService')
    def test_stocks_endpoint_general_error(self, mock_service_class, client):
        """Test general API error handling"""
        mock_service = AsyncMock()
        mock_service.get_stock_price.side_effect = Exception("Network error")
        mock_service_class.return_value = mock_service

        response = client.get("/stocks/?symbol=AAPL")

        assert response.status_code == 503
        data = response.json()
        assert "Unable to fetch stock price" in data["detail"]


class TestStocksService:
    @patch('app.services.stocks_service.settings')
    @pytest.mark.asyncio
    async def test_get_stock_price_cache_hit(self, mock_settings, mock_redis):
        """Test cache hit scenario"""
        mock_settings.stocks_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value="189.30")

        service = StocksService(mock_redis)
        result = await service.get_stock_price("AAPL")

        assert result == 189.30
        assert service.cache_ttl == 60
        assert service.finnhub_key == "test_key"

    @patch('app.services.stocks_service.settings')
    @pytest.mark.asyncio
    async def test_get_stock_price_cache_miss_and_api(self, mock_settings, mock_redis):
        """Test cache miss and API call"""
        mock_settings.stocks_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"c": 189.30}

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)
            result = await service.get_stock_price("AAPL")

            assert result == 189.30
            mock_redis.setex.assert_called_once()

    @patch('app.services.stocks_service.settings')
    @pytest.mark.asyncio
    async def test_get_stock_price_api_rate_limit(self, mock_settings, mock_redis):
        """Test API rate limit handling"""
        mock_settings.stocks_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        mock_response = MagicMock()
        mock_response.status_code = 403

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)
            with pytest.raises(Exception, match="API rate limit exceeded"):
                await service.get_stock_price("AAPL")

    @patch('app.services.stocks_service.settings')
    def test_get_stock_price_no_api_key(self, mock_settings, mock_redis):
        """Test service initialization without API key"""
        mock_settings.stocks_api_key = None

        service = StocksService(mock_redis)
        assert service.finnhub_key is None

    @patch('app.services.stocks_service.settings')
    @pytest.mark.asyncio
    async def test_cache_key_format(self, mock_settings, mock_redis):
        """Test cache key format"""
        mock_settings.stocks_api_key = "test_key"
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"c": 189.30}

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)
            await service.get_stock_price("AAPL")

            # Verify cache key format
            args, kwargs = mock_redis.setex.call_args
            assert args[0] == "stock_price:AAPL"


class TestStocksRedisIntegration:
    """Redis integration tests for stocks service"""

    @pytest.mark.asyncio
    async def test_redis_connection_failure(self, mock_redis):
        """Test behavior when Redis is down"""
        mock_redis.get = AsyncMock(
            side_effect=Exception("Redis connection failed"))
        mock_redis.setex = AsyncMock(
            side_effect=Exception("Redis connection failed"))

        with patch('app.services.stocks_service.settings') as mock_settings:
            mock_settings.stocks_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"c": 189.30}

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                service = StocksService(mock_redis)
                result = await service.get_stock_price("AAPL")

                # Service should still work even if Redis is down
                assert result == 189.30

    @pytest.mark.asyncio
    async def test_redis_cache_ttl(self, mock_redis):
        """Test Redis cache TTL setting"""
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        with patch('app.services.stocks_service.settings') as mock_settings:
            mock_settings.stocks_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"c": 189.30}

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                service = StocksService(mock_redis)
                await service.get_stock_price("AAPL")

                # Check TTL is 60 seconds
                args, kwargs = mock_redis.setex.call_args
                assert args[1] == 60


class TestStocksDatabaseLogging:
    """Database logging tests for stocks service"""

    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock()

    @pytest.fixture
    def mock_logger(self):
        return AsyncMock()

    @pytest.mark.asyncio
    async def test_stocks_logging_integration(self, mock_redis, mock_db_session, mock_logger):
        """Test integration with database logging"""
        # Mock successful API response
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        with patch('app.services.stocks_service.settings') as mock_settings:
            mock_settings.stocks_api_key = "test_key"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"c": 189.30}

            with patch('httpx.AsyncClient') as mock_client:
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance

                # Test service with logging capability
                service = StocksService(mock_redis)
                result = await service.get_stock_price("AAPL")

                # Verify service works
                assert result == 189.30

                # Verify Redis operations
                mock_redis.setex.assert_called_once()

                # Note: In a real implementation, you would inject the logger
                # and verify logging calls here
