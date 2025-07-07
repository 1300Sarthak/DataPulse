# DataPulse Deployment Guide for Render

## Prerequisites

1. **API Keys Required:**

   - Finnhub API Key (for stocks data)
   - OpenWeather API Key (for weather data)
   - GNews API Key (for news data)
   - Exchange Rate API Key (for currency data)
   - Supabase URL and Key (for database)

2. **Render Account:**
   - Sign up at [render.com](https://render.com)

## Deployment Steps

### 1. Fork/Clone Repository

```bash
git clone <your-repo-url>
cd DataPulse
```

### 2. Set Up Environment Variables on Render

In your Render dashboard, add these environment variables:

```
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
GNEWS_API_KEY=your_gnews_api_key_here
EXCHANGE_API_KEY=your_exchange_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://datapulse:datapulse_password@localhost:5432/datapulse
```

### 3. Deploy on Render

1. **Connect Repository:**

   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service:**

   - **Name:** `datapulse`
   - **Environment:** `Docker`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Build Command:** `docker build -t datapulse .`
   - **Start Command:** `docker run -p $PORT:8000 datapulse`

3. **Set Environment Variables:**

   - Add all the environment variables listed above
   - Mark sensitive ones as "Secret"

4. **Advanced Settings:**
   - **Health Check Path:** `/health/`
   - **Auto-Deploy:** Enable for automatic deployments

### 4. Database Setup (Optional)

If you want to use Render's PostgreSQL:

1. Create a new PostgreSQL database in Render
2. Update the `DATABASE_URL` environment variable with the provided connection string
3. The application will automatically create tables on first run

### 5. Redis Setup (Optional)

If you want to use Render's Redis:

1. Create a new Redis instance in Render
2. Update the `REDIS_URL` environment variable with the provided connection string

## Architecture

The deployed application uses:

- **Nginx:** Serves the React frontend and proxies API requests
- **FastAPI:** Backend API with `/api` prefix
- **PostgreSQL:** Database (optional, can use Supabase)
- **Redis:** Caching (optional)

## API Endpoints

All API endpoints are prefixed with `/api`:

- `GET /api/health/` - Health check
- `GET /api/stocks/` - Stock data
- `GET /api/crypto/` - Crypto data
- `GET /api/weather/` - Weather data
- `GET /api/news/` - News data
- `GET /api/exchange-rate/` - Exchange rates
- `POST /api/refresh` - Refresh cache

## Troubleshooting

### Common Issues:

1. **Build Fails:**

   - Check that all environment variables are set
   - Verify API keys are valid
   - Check build logs for specific errors

2. **Health Check Fails:**

   - Ensure the application starts correctly
   - Check that port 8000 is exposed
   - Verify database connections

3. **Frontend Not Loading:**
   - Check that the frontend build completed successfully
   - Verify nginx configuration
   - Check browser console for errors

### Logs:

- View logs in Render dashboard under your service
- Check both build and runtime logs

## Monitoring

- **Health Checks:** Automatic health checks every 30 seconds
- **Logs:** Available in Render dashboard
- **Metrics:** Basic metrics provided by Render

## Scaling

- **Free Tier:** Limited to 750 hours/month
- **Paid Plans:** Start at $7/month for unlimited usage
- **Auto-scaling:** Available on paid plans

## Security

- Environment variables are encrypted
- HTTPS is automatically enabled
- Non-root user runs the application
- CORS is configured for production

## Updates

To update the application:

1. Push changes to your repository
2. Render will automatically rebuild and deploy
3. Monitor the deployment logs for any issues

## Support

For issues:

1. Check Render documentation
2. Review application logs
3. Verify environment variables
4. Test locally with Docker first
