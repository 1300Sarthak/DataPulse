import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import ChartComponent from '../components/ChartComponent';
import NewsFeed from '../components/NewsFeed';
import RefreshButton from '../components/RefreshButton';
import { useApiService } from '../services/api';

const Dashboard = () => {
  const apiService = useApiService();
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState({
    crypto: null,
    stocks: null,
    weather: null,
    news: null,
    exchange: null,
  });
  const [error, setError] = useState({
    crypto: null,
    stocks: null,
    weather: null,
    news: null,
    exchange: null,
  });
  const intervalRef = useRef(null);

  const fetchAll = async () => {
    const now = new Date();
    const [crypto, stocks, weather, news, exchange] = await Promise.all([
      apiService.getCryptoPrices().catch(() => { setError(e => ({ ...e, crypto: true })); return null; }),
      apiService.getStockPrice('AAPL').catch(() => { setError(e => ({ ...e, stocks: true })); return null; }),
      apiService.getWeather('New York').catch(() => { setError(e => ({ ...e, weather: true })); return null; }),
      apiService.getNews().catch(() => { setError(e => ({ ...e, news: true })); return null; }),
      apiService.getExchangeRates().catch(() => { setError(e => ({ ...e, exchange: true })); return null; }),
    ]);
    setLastUpdated(lu => ({
      crypto: crypto ? now : lu.crypto,
      stocks: stocks ? now : lu.stocks,
      weather: weather ? now : lu.weather,
      news: news ? now : lu.news,
      exchange: exchange ? now : lu.exchange,
    }));
    setError({ crypto: !crypto, stocks: !stocks, weather: !weather, news: !news, exchange: !exchange });
  };

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchAll();
  };

  const formatLastUpdated = (date) => {
    if (!date) return null;
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)} hr ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              DataPulse Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome to your data analytics dashboard
            </p>
          </div>
          <RefreshButton onRefresh={handleRefresh} />
        </div>
        {/* Chart Section */}
        <div className="mb-8">
          <ChartComponent key={`chart-${refreshKey}`} symbol="BTC" initialPeriod="1h" />
          {error.crypto && lastUpdated.crypto && (
            <div className="text-xs text-gray-500 mt-1" data-testid="last-updated-crypto">Last updated {formatLastUpdated(lastUpdated.crypto)}</div>
          )}
        </div>
        {/* News Section */}
        <div className="mb-8">
          <Card className="w-full">
            <CardBody>
              <NewsFeed key={`news-${refreshKey}`} />
              {error.news && lastUpdated.news && (
                <div className="text-xs text-gray-500 mt-1" data-testid="last-updated-news">Last updated {formatLastUpdated(lastUpdated.news)}</div>
              )}
            </CardBody>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stock Market Card */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Stock Market</p>
                <p className="text-small text-default-500">Real-time stock prices</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get live stock prices and market data
              </p>
              {error.stocks && lastUpdated.stocks && (
                <div className="text-xs text-gray-500 mt-1" data-testid="last-updated-stocks">Last updated {formatLastUpdated(lastUpdated.stocks)}</div>
              )}
              <Button color="primary" size="sm">
                View Stocks
              </Button>
            </CardBody>
          </Card>
          {/* Crypto Card */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Cryptocurrency</p>
                <p className="text-small text-default-500">Crypto market data</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Track cryptocurrency prices and trends
              </p>
              {error.crypto && lastUpdated.crypto && (
                <div className="text-xs text-gray-500 mt-1" data-testid="last-updated-crypto">Last updated {formatLastUpdated(lastUpdated.crypto)}</div>
              )}
              <Button color="secondary" size="sm">
                View Crypto
              </Button>
            </CardBody>
          </Card>
          {/* Weather Card */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Weather</p>
                <p className="text-small text-default-500">Weather information</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Check weather conditions worldwide
              </p>
              {error.weather && lastUpdated.weather && (
                <div className="text-xs text-gray-500 mt-1" data-testid="last-updated-weather">Last updated {formatLastUpdated(lastUpdated.weather)}</div>
              )}
              <Button color="success" size="sm">
                View Weather
              </Button>
            </CardBody>
          </Card>
          {/* News Card */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">News</p>
                <p className="text-small text-default-500">Latest headlines</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Stay updated with top news stories
              </p>
              {error.news && lastUpdated.news && (
                <div className="text-xs text-gray-500 mt-1" data-testid="last-updated-news">Last updated {formatLastUpdated(lastUpdated.news)}</div>
              )}
              <Button color="warning" size="sm">
                View News
              </Button>
            </CardBody>
          </Card>
          {/* Exchange Rates Card */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Exchange Rates</p>
                <p className="text-small text-default-500">Currency conversion</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Real-time currency exchange rates
              </p>
              {error.exchange && lastUpdated.exchange && (
                <div className="text-xs text-gray-500 mt-1" data-testid="last-updated-exchange">Last updated {formatLastUpdated(lastUpdated.exchange)}</div>
              )}
              <Button color="danger" size="sm">
                View Rates
              </Button>
            </CardBody>
          </Card>
          {/* System Status Card */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">System Status</p>
                <p className="text-small text-default-500">Service health</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Chip color="success" size="sm">All Systems Operational</Chip>
              </div>
              <Button color="default" size="sm">
                Check Status
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 