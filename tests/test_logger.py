import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.logger import DatabaseLogger
from app.models.logs import PriceLog, NewsLog
from datetime import datetime


@pytest.fixture
def mock_db_session():
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def logger(mock_db_session):
    return DatabaseLogger(mock_db_session)


class TestDatabaseLogger:
    @pytest.mark.asyncio
    async def test_log_price_data_success(self, logger, mock_db_session):
        """Test successful price data logging"""
        # Setup
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        # Execute
        result = await logger.log_price_data("crypto", "BTC", 45000.0)

        # Assert
        assert result is True
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

        # Verify the added object
        added_object = mock_db_session.add.call_args[0][0]
        assert isinstance(added_object, PriceLog)
        assert added_object.source == "crypto"
        assert added_object.symbol == "BTC"
        assert added_object.value == 45000.0

    @pytest.mark.asyncio
    async def test_log_price_data_symbol_normalization(self, logger, mock_db_session):
        """Test that symbols are normalized to uppercase"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        result = await logger.log_price_data("stocks", "aapl", 189.30)

        assert result is True
        added_object = mock_db_session.add.call_args[0][0]
        assert added_object.symbol == "AAPL"

    @pytest.mark.asyncio
    async def test_log_price_data_db_failure(self, logger, mock_db_session):
        """Test graceful handling of database failure"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock(
            side_effect=Exception("Database connection failed"))
        mock_db_session.rollback = AsyncMock()

        result = await logger.log_price_data("crypto", "ETH", 3000.0)

        assert result is False
        mock_db_session.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_news_data_success(self, logger, mock_db_session):
        """Test successful news data logging"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        result = await logger.log_news_data(
            "Bitcoin Reaches New High",
            "CoinDesk",
            "https://coindesk.com/bitcoin-high"
        )

        assert result is True
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

        # Verify the added object
        added_object = mock_db_session.add.call_args[0][0]
        assert isinstance(added_object, NewsLog)
        assert added_object.title == "Bitcoin Reaches New High"
        assert added_object.source == "CoinDesk"
        assert added_object.url == "https://coindesk.com/bitcoin-high"

    @pytest.mark.asyncio
    async def test_log_news_data_db_failure(self, logger, mock_db_session):
        """Test graceful handling of news logging database failure"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock(
            side_effect=Exception("Database error"))
        mock_db_session.rollback = AsyncMock()

        result = await logger.log_news_data(
            "Test News",
            "Test Source",
            "https://test.com"
        )

        assert result is False
        mock_db_session.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_batch_price_data_success(self, logger, mock_db_session):
        """Test successful batch price data logging"""
        mock_db_session.add_all = MagicMock()
        mock_db_session.commit = AsyncMock()

        price_data = [
            {"source": "crypto", "symbol": "BTC", "value": 45000.0},
            {"source": "crypto", "symbol": "ETH", "value": 3000.0},
            {"source": "stocks", "symbol": "AAPL", "value": 189.30}
        ]

        result = await logger.log_batch_price_data(price_data)

        assert result == 3
        mock_db_session.add_all.assert_called_once()
        mock_db_session.commit.assert_called_once()

        # Verify all objects were added
        added_objects = mock_db_session.add_all.call_args[0][0]
        assert len(added_objects) == 3
        assert all(isinstance(obj, PriceLog) for obj in added_objects)
        assert added_objects[0].symbol == "BTC"
        assert added_objects[1].symbol == "ETH"
        assert added_objects[2].symbol == "AAPL"

    @pytest.mark.asyncio
    async def test_log_batch_price_data_db_failure(self, logger, mock_db_session):
        """Test graceful handling of batch logging database failure"""
        mock_db_session.add_all = MagicMock()
        mock_db_session.commit = AsyncMock(
            side_effect=Exception("Batch insert failed"))
        mock_db_session.rollback = AsyncMock()

        price_data = [
            {"source": "crypto", "symbol": "BTC", "value": 45000.0}
        ]

        result = await logger.log_batch_price_data(price_data)

        assert result == 0
        mock_db_session.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_batch_price_data_empty_list(self, logger, mock_db_session):
        """Test batch logging with empty list"""
        mock_db_session.add_all = MagicMock()
        mock_db_session.commit = AsyncMock()

        result = await logger.log_batch_price_data([])

        assert result == 0
        mock_db_session.add_all.assert_called_once_with([])


class TestDatabaseLoggerSchema:
    """Test schema correctness and data validation"""

    @pytest.mark.asyncio
    async def test_price_log_schema(self, logger, mock_db_session):
        """Test PriceLog model schema"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        await logger.log_price_data("crypto", "BTC", 45000.0)

        added_object = mock_db_session.add.call_args[0][0]

        # Test required fields
        assert hasattr(added_object, 'source')
        assert hasattr(added_object, 'symbol')
        assert hasattr(added_object, 'value')
        assert hasattr(added_object, 'timestamp')
        assert hasattr(added_object, 'id')
        assert hasattr(added_object, 'created_at')
        assert hasattr(added_object, 'updated_at')

        # Test data types
        assert isinstance(added_object.source, str)
        assert isinstance(added_object.symbol, str)
        assert isinstance(added_object.value, float)

    @pytest.mark.asyncio
    async def test_news_log_schema(self, logger, mock_db_session):
        """Test NewsLog model schema"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        await logger.log_news_data(
            "Test News Title",
            "Test Source",
            "https://test.com/article"
        )

        added_object = mock_db_session.add.call_args[0][0]

        # Test required fields
        assert hasattr(added_object, 'title')
        assert hasattr(added_object, 'source')
        assert hasattr(added_object, 'url')
        assert hasattr(added_object, 'timestamp')
        assert hasattr(added_object, 'id')
        assert hasattr(added_object, 'created_at')
        assert hasattr(added_object, 'updated_at')

        # Test data types
        assert isinstance(added_object.title, str)
        assert isinstance(added_object.source, str)
        assert isinstance(added_object.url, str)


class TestDatabaseLoggerEdgeCases:
    """Test edge cases and error conditions"""

    @pytest.mark.asyncio
    async def test_log_price_data_with_zero_value(self, logger, mock_db_session):
        """Test logging price data with zero value"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        result = await logger.log_price_data("crypto", "BTC", 0.0)

        assert result is True
        added_object = mock_db_session.add.call_args[0][0]
        assert added_object.value == 0.0

    @pytest.mark.asyncio
    async def test_log_price_data_with_negative_value(self, logger, mock_db_session):
        """Test logging price data with negative value"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        result = await logger.log_price_data("crypto", "BTC", -100.0)

        assert result is True
        added_object = mock_db_session.add.call_args[0][0]
        assert added_object.value == -100.0

    @pytest.mark.asyncio
    async def test_log_news_data_with_long_title(self, logger, mock_db_session):
        """Test logging news data with very long title"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        long_title = "A" * 1000  # Very long title
        result = await logger.log_news_data(
            long_title,
            "Test Source",
            "https://test.com"
        )

        assert result is True
        added_object = mock_db_session.add.call_args[0][0]
        assert added_object.title == long_title

    @pytest.mark.asyncio
    async def test_log_news_data_with_special_characters(self, logger, mock_db_session):
        """Test logging news data with special characters"""
        mock_db_session.add = MagicMock()
        mock_db_session.commit = AsyncMock()

        special_title = "Bitcoin & Ethereum: What's Next? 🚀"
        result = await logger.log_news_data(
            special_title,
            "Crypto News",
            "https://crypto.com/news"
        )

        assert result is True
        added_object = mock_db_session.add.call_args[0][0]
        assert added_object.title == special_title
