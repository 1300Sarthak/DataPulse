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

### Quick Deploy to Render

The application is ready for deployment on Render with a single click:

1. **Fork this repository** to your GitHub account
2. **Sign up for Render** at [render.com](https://render.com)
3. **Create a new Web Service** and connect your forked repository
4. **Set environment variables** (see DEPLOYMENT.md for details)
5. **Deploy!**

### Manual Deployment

```bash
# Build the production image
./build.sh

# Test locally
docker run -p 8000:80 datapulse

# Deploy to your preferred platform
```

### Environment Variables Required

- `FINNHUB_API_KEY` - For stocks data
- `OPENWEATHER_API_KEY` - For weather data
- `GNEWS_API_KEY` - For news data
- `EXCHANGE_API_KEY` - For currency data
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

The application is containerized and ready for deployment. The GitHub Actions workflow automatically runs tests on push to the main branch.
