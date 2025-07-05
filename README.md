# DataPulse Backend

A real-time analytics dashboard backend built with FastAPI, Redis, and Supabase.

## Features

- FastAPI backend with async support
- Redis caching layer
- Supabase PostgreSQL database
- Docker and Docker Compose setup
- Automated testing with pytest
- GitHub Actions CI/CD

## Setup

### 1. Environment Variables

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Required environment variables:

- **API Keys**: `CRYPTO_API_KEY`, `STOCKS_API_KEY`, `WEATHER_API_KEY`, `NEWS_API_KEY`, `EXCHANGE_API_KEY`
- **Supabase**: `SUPABASE_URL` (your Supabase project URL)
- **Database**: `SUPABASE_DB_PASSWORD` (set in your .env file)
- **Redis**: `REDIS_URL` (default: "redis://localhost:6379")

### 2. Running Locally with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 3. Running Locally without Docker

```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis (if not running)
redis-server

# Run the application
uvicorn app.main:app --reload
```

## API Endpoints

- `GET /` - Root endpoint with API info
- `GET /health/` - Health check for all services
- `GET /docs` - Interactive API documentation (Swagger UI)

## Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app

# Run tests in Docker
docker-compose exec app pytest
```

## Project Structure

```
DataPulse/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Pydantic settings
│   ├── database.py          # SQLAlchemy setup
│   ├── cache.py             # Redis setup
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   └── routes/              # API endpoints
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Multi-service setup
└── .github/workflows/      # CI/CD workflows
```

## Development

The application uses:

- **FastAPI** for the web framework
- **SQLAlchemy** with asyncpg for database operations
- **Redis** for caching
- **Pydantic** for data validation and settings
- **pytest** for testing

## Deployment

The application is containerized and ready for deployment. The GitHub Actions workflow automatically runs tests on push to the main branch.
