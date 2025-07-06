import React, { useState, useEffect } from "react";
import { Button, Chip, Select, SelectItem } from "@heroui/react";
import BentoCard from "../components/BentoCard";
import WeatherCard from "../components/WeatherCard";
import NewsCard from "../components/NewsCard";
import ExchangeRateCard from "../components/ExchangeRateCard";
import { useErrorToast } from "../context/ErrorToastContext";
import { useSettings } from "../context/SettingsContext";
import apiService from "../services/api.js";

const NEWS_TIME_RANGES = [
  { key: "1h", label: "Last Hour" },
  { key: "24h", label: "24 Hours" },
  { key: "7d", label: "1 Week" },
  { key: "30d", label: "30 Days" }
];

const Dashboard = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [newsTimeRange, setNewsTimeRange] = useState("24h");

  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { showError } = useErrorToast();
  const { settings } = useSettings();

  // Fetch data from APIs
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch crypto data - convert object to array format
      const cryptoResponse = await apiService.getCryptoPrices();
      if (Array.isArray(cryptoResponse)) {
        const cryptoArray = cryptoResponse
          .filter(crypto => settings.crypto.symbols.includes(crypto.symbol))
          .map(crypto => ({
            symbol: crypto.symbol,
            title: crypto.name || crypto.symbol,
            price: crypto.price,
            change: Math.random() * 10 - 5, // Mock change for now
            type: 'crypto'
          }));
        setCryptoData(cryptoArray);
      } else {
        setCryptoData([]);
      }

      // Fetch stock data for configured symbols
      const stockSymbols = settings.stocks.symbols.slice(0, 8); // Limit to 8 symbols
      const stockPromises = stockSymbols.map(symbol => 
        apiService.getStockPrice(symbol).catch(err => {
          console.error(`Failed to fetch ${symbol}:`, err);
          return null;
        })
      );
      
      const stockResponses = await Promise.all(stockPromises);
      const stockArray = stockResponses
        .filter(response => response && response.price)
        .map(response => ({
          symbol: response.symbol,
          title: response.symbol,
          price: response.price,
          change: Math.random() * 10 - 5, // Mock change for now
          type: 'stock'
        }));
      setStockData(stockArray);

      // Fetch exchange rates
      const rates = await apiService.getExchangeRates();
      setExchangeRates(rates);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      if (typeof showError === 'function') showError("Failed to fetch dashboard data");
      // Fallback to empty arrays for critical data
      setCryptoData([]);
      setStockData([]);
      setExchangeRates(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch news for selected time range
  const fetchNews = async (timeRange) => {
    setNewsLoading(true);
    try {
      const url = `/news/?time_range=${timeRange}`;
      const response = await fetch(url);
      const data = await response.json();
      setNewsData(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch {
      setNewsData([]);
      if (typeof showError === 'function') showError("Failed to fetch news");
    } finally {
      setNewsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await fetchData();
    await fetchNews(newsTimeRange);
  };

  // Initialize data
  useEffect(() => {
    fetchData();
  }, []); // Only fetch on mount

  // Fetch news when time range changes
  useEffect(() => {
    fetchNews(newsTimeRange);
  }, [newsTimeRange]);

  // Re-fetch when stock or crypto symbols change
  useEffect(() => {
    if (lastUpdated) {
      fetchData();
      fetchNews(newsTimeRange);
    }
  }, [settings.stocks.symbols, settings.crypto.symbols]);

  // Auto-refresh based on settings
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      fetchNews(newsTimeRange);
    }, Math.min(settings.stocks.refreshInterval, settings.crypto.refreshInterval) * 1000);

    return () => clearInterval(interval);
  }, [settings.stocks.refreshInterval, settings.crypto.refreshInterval, newsTimeRange]);

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return "Never";
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const safeCryptoData = Array.isArray(cryptoData) ? cryptoData : [];
  const safeStockData = Array.isArray(stockData) ? stockData : [];
  const safeNewsData = Array.isArray(newsData) ? newsData : [];

  // Function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Combine all cards and shuffle them
  const allCards = [
    // Crypto cards
    ...safeCryptoData.map((crypto, i) => ({
      ...(crypto || { title: 'Crypto', price: '', change: '', symbol: '', type: 'crypto' }),
      loading: !crypto,
      key: `crypto-${crypto?.symbol || i}`,
      component: 'BentoCard'
    })),
    // Stock cards
    ...(safeStockData.length > 0 ? safeStockData : Array(4).fill(null)).map((stock, i) => ({
      ...(stock || { title: 'Stock', price: '', change: '', symbol: '', type: 'stock' }),
      loading: !stock,
      key: `stock-${i}`,
      component: 'BentoCard'
    })),
    // Weather card
    { key: 'weather', component: 'WeatherCard' },
    // Exchange rate card
    { key: 'exchange-rate', component: 'ExchangeRateCard', rates: exchangeRates, loading }
  ];

  // Use state to store shuffled cards so they persist during re-renders
  const [shuffledCards, setShuffledCards] = useState([]);

  // Shuffle cards when data changes
  useEffect(() => {
    if (allCards.length > 0) {
      setShuffledCards(shuffleArray(allCards));
    }
  }, [safeCryptoData, safeStockData, exchangeRates, loading]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="max-w-screen-2xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors mb-2">
              DataPulse Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-100 mt-1 transition-colors">
              All your information in one place at one time
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-base text-gray-500 dark:text-gray-100 transition-colors">
              Last updated: {formatLastUpdated()}
            </div>
            <Button
              color="primary"
              variant="solid"
              onClick={handleRefresh}
              disabled={loading || newsLoading}
              className="font-medium px-6 py-2 text-lg"
            >
              {(loading || newsLoading) ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="max-w-screen-2xl mx-auto mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-[minmax(150px,auto)] gap-8">
          {shuffledCards.map((card) => {
            if (card.component === 'BentoCard') {
              return (
                <BentoCard
                  key={card.key}
                  title={card.title}
                  symbol={card.symbol}
                  price={card.price}
                  change={card.change}
                  type={card.type}
                  loading={card.loading}
                />
              );
            } else if (card.component === 'WeatherCard') {
              return <WeatherCard key={card.key} />;
            } else if (card.component === 'ExchangeRateCard') {
              return <ExchangeRateCard key={card.key} rates={card.rates} loading={card.loading} />;
            }
            return null;
          })}
        </div>
      </div>

      {/* News Section */}
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top News</h2>
          <Select
            label="Time Range"
            value={newsTimeRange}
            onChange={e => setNewsTimeRange(e.target.value)}
            className="w-48"
          >
            {NEWS_TIME_RANGES.map(range => (
              <SelectItem key={range.key} value={range.key}>
                {range.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-[minmax(150px,auto)] gap-6">
          {newsLoading ? (
            <div className="col-span-full text-center py-10">
              <span className="text-lg text-gray-500 dark:text-gray-400">Loading news...</span>
            </div>
          ) : safeNewsData.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <span className="text-lg text-gray-500 dark:text-gray-400">No news found for this time range.</span>
            </div>
          ) : (
            safeNewsData.map((news, i) => (
              <NewsCard
                key={`news-${i}`}
                title={news.title}
                source={news.source}
                image={news.image}
                publishedAt={news.publishedAt}
                url={news.url}
                loading={newsLoading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 