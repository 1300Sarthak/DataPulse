from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Keys
    crypto_api_key: Optional[str] = None
    stocks_api_key: Optional[str] = None
    weather_api_key: Optional[str] = None
    news_api_key: Optional[str] = None
    exchange_api_key: Optional[str] = None

    # Environment variable aliases for API keys
    finnhub_api_key: Optional[str] = None
    coingecko_api_key: Optional[str] = None
    openweather_api_key: Optional[str] = None
    gnews_api_key: Optional[str] = None
    supabase_key: Optional[str] = None
    # For Vite environment variables
    vite_openweather_api_key: Optional[str] = None

    # Supabase Configuration
    supabase_url: str
    supabase_db_password: str
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # Redis Configuration
    redis_url: str = "redis://localhost:6379"

    # Database Configuration
    database_url: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def crypto_api_key_resolved(self) -> Optional[str]:
        """Get crypto API key from environment"""
        return self.crypto_api_key or self.coingecko_api_key

    @property
    def stocks_api_key_resolved(self) -> Optional[str]:
        """Get stocks API key from environment"""
        return self.stocks_api_key or self.finnhub_api_key

    @property
    def database_url_async(self) -> str:
        """Generate async database URL for Supabase"""
        if self.database_url:
            return self.database_url

        # For Supabase, the correct format is:
        # postgresql+asyncpg://postgres:password@db.project-ref.supabase.co:5432/postgres
        supabase_host = self.supabase_url.replace(
            "https://", "").replace("http://", "")
        # Extract project reference from the host
        project_ref = supabase_host.split(".")[0]

        return f"postgresql://postgres:{self.supabase_db_password}@db.{project_ref}.supabase.co:5432/postgres"


settings = Settings()
