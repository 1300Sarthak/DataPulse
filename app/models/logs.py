from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.models.base import BaseModel


class PriceLog(BaseModel):
    """Model for storing price data logs"""
    __tablename__ = "price_logs"

    source = Column(String(50), nullable=False, index=True)  # crypto/stocks
    symbol = Column(String(20), nullable=False, index=True)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True),
                       server_default=func.now(), index=True)


class NewsLog(BaseModel):
    """Model for storing news data logs"""
    __tablename__ = "news_logs"

    source = Column(String(50), nullable=False, index=True)
    title = Column(Text, nullable=False)
    url = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True),
                       server_default=func.now(), index=True)
