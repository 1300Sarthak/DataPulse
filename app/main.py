from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routes import health, crypto, stocks, weather, news, exchange_rate, refresh
from app.database import init_db, engine
from app.cache import close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    try:
        await init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Application will start without database connection")
    yield
    # Shutdown
    try:
        await engine.dispose()
        await close_redis()
    except Exception as e:
        print(f"Warning: Shutdown error: {e}")


app = FastAPI(
    title="DataPulse API",
    description="Real-time analytics dashboard backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(health.router, prefix="/api")
app.include_router(crypto.router, prefix="/api")
app.include_router(stocks.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(exchange_rate.router, prefix="/api")
app.include_router(refresh.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DataPulse API",
        "version": "1.0.0",
        "docs": "/docs"
    }
