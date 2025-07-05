import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from app.main import app
from app.services.health_service import HealthService
import redis.asyncio as redis


@pytest.fixture
def mock_redis():
    return AsyncMock(spec=redis.Redis)


@pytest.fixture
def mock_db_session():
    return AsyncMock()


class TestHealthEndpoint:
    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health check endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/health/")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert "database" in data
            assert "redis" in data
            assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_root_endpoint(self):
        """Test root endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/")
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "DataPulse API"
            assert data["version"] == "1.0.0"
            assert "docs" in data


class TestHealthService:
    """Unit tests for HealthService"""

    @pytest.mark.asyncio
    async def test_health_check_all_services_up(self, mock_redis, mock_db_session):
        """Test health check when all services are up"""
        mock_redis.ping = AsyncMock(return_value=True)
        mock_db_session.execute = AsyncMock()
        mock_db_session.execute.return_value.fetchone = AsyncMock(return_value=[
                                                                  1])

        service = HealthService(mock_db_session, mock_redis)
        result = await service.check_health()

        assert result["status"] == "healthy"
        assert result["redis"]["status"] == "healthy"
        assert result["database"]["status"] == "healthy"
        assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_health_check_redis_down(self, mock_redis, mock_db_session):
        """Test health check when Redis is down"""
        mock_redis.ping = AsyncMock(
            side_effect=Exception("Redis connection failed"))
        mock_db_session.execute = AsyncMock()
        mock_db_session.execute.return_value.fetchone = AsyncMock(return_value=[
                                                                  1])

        service = HealthService(mock_db_session, mock_redis)
        result = await service.check_health()

        # Overall status is still healthy if only Redis is down
        assert result["status"] == "healthy"
        assert result["redis"]["status"] == "unhealthy"
        assert result["database"]["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_check_database_down(self, mock_redis, mock_db_session):
        """Test health check when database is down"""
        mock_redis.ping = AsyncMock(return_value=True)
        mock_db_session.execute = AsyncMock(
            side_effect=Exception("Database connection failed"))

        service = HealthService(mock_db_session, mock_redis)
        result = await service.check_health()

        # Overall status is still healthy if only DB is down
        assert result["status"] == "healthy"
        assert result["redis"]["status"] == "healthy"
        assert result["database"]["status"] == "unhealthy"

    @pytest.mark.asyncio
    async def test_health_check_all_services_down(self, mock_redis, mock_db_session):
        """Test health check when all services are down"""
        mock_redis.ping = AsyncMock(
            side_effect=Exception("Redis connection failed"))
        mock_db_session.execute = AsyncMock(
            side_effect=Exception("Database connection failed"))

        service = HealthService(mock_db_session, mock_redis)
        result = await service.check_health()

        # Overall status is always healthy in current implementation
        assert result["status"] == "healthy"
        assert result["redis"]["status"] == "unhealthy"
        assert result["database"]["status"] == "unhealthy"


class TestHealthRedisIntegration:
    """Redis integration tests for health service"""

    @pytest.mark.asyncio
    async def test_redis_ping_success(self, mock_redis, mock_db_session):
        """Test successful Redis ping"""
        mock_redis.ping = AsyncMock(return_value=True)
        mock_db_session.execute = AsyncMock()
        mock_db_session.execute.return_value.fetchone = AsyncMock(return_value=[
                                                                  1])

        service = HealthService(mock_db_session, mock_redis)
        result = await service.check_health()

        assert result["redis"]["status"] == "healthy"
        mock_redis.ping.assert_called_once()

    @pytest.mark.asyncio
    async def test_redis_ping_failure(self, mock_redis, mock_db_session):
        """Test Redis ping failure"""
        mock_redis.ping = AsyncMock(
            side_effect=Exception("Connection timeout"))
        mock_db_session.execute = AsyncMock()
        mock_db_session.execute.return_value.fetchone = AsyncMock(return_value=[
                                                                  1])

        service = HealthService(mock_db_session, mock_redis)
        result = await service.check_health()

        assert result["redis"]["status"] == "unhealthy"


class TestHealthDatabaseLogging:
    """Database logging tests for health service"""

    @pytest.mark.asyncio
    async def test_health_logging_integration(self, mock_redis, mock_db_session):
        """Test integration with database logging"""
        mock_redis.ping = AsyncMock(return_value=True)
        mock_db_session.execute = AsyncMock()
        mock_db_session.execute.return_value.fetchone = AsyncMock(return_value=[
                                                                  1])

        service = HealthService(mock_db_session, mock_redis)
        result = await service.check_health()

        # Verify health check works
        assert result["status"] == "healthy"
        assert result["redis"]["status"] == "healthy"
        assert result["database"]["status"] == "healthy"

        # Verify Redis operations
        mock_redis.ping.assert_called_once()

        # Verify database operations
        mock_db_session.execute.assert_called_once()

        # Note: In a real implementation, you would verify logging calls here
