from supabase import create_client, Client
from app.config import settings
from typing import Optional


class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize Supabase client"""
        try:
            if settings.supabase_url and settings.supabase_anon_key:
                self.client = create_client(
                    settings.supabase_url,
                    settings.supabase_anon_key
                )
                print("Supabase client initialized successfully")
            else:
                print("Warning: Supabase URL or anon key not provided")
        except Exception as e:
            print(f"Warning: Failed to initialize Supabase client: {e}")

    def get_client(self) -> Optional[Client]:
        """Get Supabase client"""
        return self.client

    def get_service_client(self) -> Optional[Client]:
        """Get Supabase client with service role key (for admin operations)"""
        try:
            if settings.supabase_url and settings.supabase_service_role_key:
                return create_client(
                    settings.supabase_url,
                    settings.supabase_service_role_key
                )
            else:
                print("Warning: Service role key not provided")
                return None
        except Exception as e:
            print(f"Warning: Failed to create service client: {e}")
            return None


# Global instance
supabase_service = SupabaseService()
