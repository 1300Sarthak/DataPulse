import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from app.models.logs import PriceLog, NewsLog
from typing import Optional

logger = logging.getLogger(__name__)


class DatabaseLogger:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def log_price_data(self, source: str, symbol: str, value: float) -> bool:
        """
        Log price data to the database

        Args:
            source: 'crypto' or 'stocks'
            symbol: Symbol like 'BTC' or 'AAPL'
            value: Price value

        Returns:
            bool: True if logged successfully, False otherwise
        """
        try:
            # Create price log entry
            price_log = PriceLog(
                source=source,
                symbol=symbol.upper(),
                value=value
            )

            self.db_session.add(price_log)
            await self.db_session.commit()

            logger.info(f"Logged price data: {source} {symbol} = {value}")
            return True

        except Exception as e:
            logger.error(f"Failed to log price data: {e}")
            await self.db_session.rollback()
            return False

    async def log_news_data(self, title: str, source: str, url: str) -> bool:
        """
        Log news data to the database

        Args:
            title: News headline title
            source: News source
            url: News article URL

        Returns:
            bool: True if logged successfully, False otherwise
        """
        try:
            # Create news log entry
            news_log = NewsLog(
                title=title,
                source=source,
                url=url
            )

            self.db_session.add(news_log)
            await self.db_session.commit()

            logger.info(f"Logged news data: {source} - {title[:50]}...")
            return True

        except Exception as e:
            logger.error(f"Failed to log news data: {e}")
            await self.db_session.rollback()
            return False

    async def log_batch_price_data(self, price_data: list) -> int:
        """
        Log multiple price data entries in a batch

        Args:
            price_data: List of dicts with 'source', 'symbol', 'value'

        Returns:
            int: Number of successfully logged entries
        """
        try:
            price_logs = []
            for data in price_data:
                price_log = PriceLog(
                    source=data['source'],
                    symbol=data['symbol'].upper(),
                    value=data['value']
                )
                price_logs.append(price_log)

            self.db_session.add_all(price_logs)
            await self.db_session.commit()

            logger.info(f"Batch logged {len(price_logs)} price entries")
            return len(price_logs)

        except Exception as e:
            logger.error(f"Failed to batch log price data: {e}")
            await self.db_session.rollback()
            return 0
