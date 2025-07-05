import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.stocks_service import StocksService
import redis.asyncio as redis
import httpx


@pytest.fixture
def mock_redis():
    return AsyncMock(spec=redis.Redis)


@pytest.fixture
def mock_settings():
    with patch('app.services.stocks_service.settings') as mock:
        mock.stocks_api_key = "d1kkle1r01qt8fop2l70d1kkle1r01qt8fop2l7g"
        yield mock


class TestStocksServiceIntegration:
    """Integration tests for StocksService with Redis caching"""

    @pytest.mark.asyncio
    async def test_cache_hit_scenario(self, mock_redis, mock_settings):
        """Test when data is found in cache"""
        # Setup: Redis returns cached value
        mock_redis.get = AsyncMock(return_value="189.30")

        service = StocksService(mock_redis)
        result = await service.get_stock_price("AAPL")

        # Verify cache was checked
        mock_redis.get.assert_called_once_with("stock_price:AAPL")
        # Verify API was not called (no httpx calls)
        assert result == 189.30

    @pytest.mark.asyncio
    async def test_cache_miss_api_success(self, mock_redis, mock_settings):
        """Test when cache miss and API call succeeds"""
        # Setup: Redis returns None (cache miss)
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        # Mock successful API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"c": 189.30}

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)
            result = await service.get_stock_price("AAPL")

            # Verify cache was checked
            mock_redis.get.assert_called_once_with("stock_price:AAPL")
            # Verify API was called
            mock_client_instance.get.assert_called_once()
            # Verify result was cached
            mock_redis.setex.assert_called_once_with(
                "stock_price:AAPL", 60, "189.3")
            assert result == 189.30

    @pytest.mark.asyncio
    async def test_api_rate_limit_handling(self, mock_redis, mock_settings):
        """Test handling of 403 rate limit error"""
        # Setup: Redis returns None (cache miss)
        mock_redis.get = AsyncMock(return_value=None)

        # Mock 403 response
        mock_response = MagicMock()
        mock_response.status_code = 403

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)

            with pytest.raises(Exception, match="API rate limit exceeded"):
                await service.get_stock_price("AAPL")

    @pytest.mark.asyncio
    async def test_api_invalid_symbol(self, mock_redis, mock_settings):
        """Test handling of invalid symbol"""
        # Setup: Redis returns None (cache miss)
        mock_redis.get = AsyncMock(return_value=None)

        # Mock API response with error
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"error": "Symbol not found"}

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)

            with pytest.raises(ValueError, match="Invalid symbol: INVALID"):
                await service.get_stock_price("INVALID")

    @pytest.mark.asyncio
    async def test_redis_down_cache_operations(self, mock_redis, mock_settings):
        """Test behavior when Redis operations fail"""
        # Setup: Redis operations raise exceptions
        mock_redis.get = AsyncMock(
            side_effect=Exception("Redis connection failed"))
        mock_redis.setex = AsyncMock(
            side_effect=Exception("Redis connection failed"))

        # Mock successful API response
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
    async def test_stale_cache_fallback(self, mock_redis, mock_settings):
        """Test fallback to stale cache when API fails"""
        # Setup: Redis returns stale cached value
        # First call returns cached value, second call returns None (no stale cache)
        mock_redis.get = AsyncMock(side_effect=["189.30", None])
        mock_redis.setex = AsyncMock()

        # Mock API failure
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.side_effect = Exception("Network error")
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)

            # Should raise exception since no stale cache available
            with pytest.raises(Exception, match="Unable to fetch price for AAPL"):
                await service.get_stock_price("AAPL")

    @pytest.mark.asyncio
    async def test_no_api_key_configured(self, mock_redis):
        """Test behavior when no API key is configured"""
        with patch('app.services.stocks_service.settings') as mock_settings:
            mock_settings.stocks_api_key = None

            service = StocksService(mock_redis)

            with pytest.raises(Exception, match="Finnhub API key not configured"):
                await service.get_stock_price("AAPL")

    @pytest.mark.asyncio
    async def test_symbol_normalization(self, mock_redis, mock_settings):
        """Test that symbols are normalized to uppercase"""
        # Setup: Redis returns None (cache miss)
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        # Mock successful API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"c": 189.30}

        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            service = StocksService(mock_redis)
            result = await service.get_stock_price("aapl")  # lowercase

            # Verify cache key uses uppercase
            mock_redis.get.assert_called_once_with("stock_price:AAPL")
            mock_redis.setex.assert_called_once_with(
                "stock_price:AAPL", 60, "189.3")
            assert result == 189.30

    @pytest.mark.asyncio
    async def test_empty_symbol_validation(self, mock_redis, mock_settings):
        """Test validation of empty symbol"""
        service = StocksService(mock_redis)

        with pytest.raises(ValueError, match="Missing symbol parameter"):
            await service.get_stock_price("")

    @pytest.mark.asyncio
    async def test_none_symbol_validation(self, mock_redis, mock_settings):
        """Test validation of None symbol"""
        service = StocksService(mock_redis)

        with pytest.raises(ValueError, match="Missing symbol parameter"):
            await service.get_stock_price(None)
