import React, { useState, useEffect } from "react";
import { Button, Chip } from "@heroui/react";
import BentoCard from "../components/BentoCard";
import WeatherCard from "../components/WeatherCard";
import NewsCard from "../components/NewsCard";
import ExchangeRateCard from "../components/ExchangeRateCard";
import { useErrorToast } from "../context/ErrorToastContext";
import { useSettings } from "../context/SettingsContext";
import apiService from "../services/api.js";

const Dashboard = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [exchangeRates, setExchangeRates] = useState(null);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { showError } = useErrorToast();
  const { settings } = useSettings();

  // Mock data for demonstration
  const mockNewsData = [
    {
      title: "Bitcoin Surges Past $43,000 as Institutional Adoption Grows",
      symbol: "BTC",
      image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop",
      url: "https://example.com/bitcoin-news-1"
    },
    {
      title: "Tesla Reports Strong Q4 Earnings, Stock Climbs 5%",
      symbol: "TSLA",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
      url: "https://example.com/tesla-news-1"
    },
    {
      title: "Federal Reserve Signals Potential Rate Cuts in 2024",
      symbol: "FED",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop",
      url: "https://example.com/fed-news-1"
    },
    {
      title: "Ethereum Layer 2 Solutions See Record Growth",
      symbol: "ETH",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop",
      url: "https://example.com/ethereum-news-1"
    }
  ];

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

      // Fetch news data (keep fallback for news only)
      const newsResponse = await apiService.getNews();
      setNewsData(Array.isArray(newsResponse) ? newsResponse : mockNewsData);

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
      setNewsData(mockNewsData);
      setExchangeRates(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await fetchData();
  };

  // Initialize data
  useEffect(() => {
    fetchData();
  }, []); // Only fetch on mount

  // Re-fetch when stock or crypto symbols change
  useEffect(() => {
    if (lastUpdated) { // Only re-fetch if we've already loaded data once
      fetchData();
    }
  }, [settings.stocks.symbols, settings.crypto.symbols]); // Only re-fetch when symbols change

  // Auto-refresh based on settings
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, Math.min(settings.stocks.refreshInterval, settings.crypto.refreshInterval) * 1000);

    return () => clearInterval(interval);
  }, [settings.stocks.refreshInterval, settings.crypto.refreshInterval]);

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
              Real-time financial data and market insights
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
              disabled={loading}
              className="font-medium px-6 py-2 text-lg"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Simple Responsive Grid */}
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-[minmax(150px,auto)] gap-8">
          {/* BTC Card (large) */}
          {safeCryptoData.find(c => c && c.symbol === 'BTC') && (
            <BentoCard
              {...safeCryptoData.find(c => c && c.symbol === 'BTC')}
              size="md"
              loading={loading}
              key="crypto-btc"
              className="card-light dark:card-dark transition-colors duration-500 col-span-2 row-span-2"
            />
          )}
          {/* Other Crypto Cards */}
          {safeCryptoData.filter(c => c && c.symbol !== 'BTC').map((crypto, i) => (
            <BentoCard
              {...(crypto || { title: 'Crypto', price: '', change: '', symbol: '', type: 'crypto' })}
              size="md"
              loading={!crypto}
              key={`crypto-${crypto?.symbol || i}`}
              className="card-light dark:card-dark transition-colors duration-500 col-span-1 row-span-1"
            />
          ))}
          {/* Stock Cards or Placeholders */}
          {(safeStockData.length > 0 ? safeStockData : Array(4).fill(null)).map((stock, i) => (
            <BentoCard
              {...(stock || { title: 'Stock', price: '', change: '', symbol: '', type: 'stock' })}
              size="md"
              loading={!stock}
              key={`stock-${i}`}
              className="card-light dark:card-dark transition-colors duration-500"
            />
          ))}
          {/* Weather Card */}
          <WeatherCard size="md" key="weather" />
          {/* Exchange Rate Card */}
          <ExchangeRateCard rates={exchangeRates} loading={loading} key="exchange-rate" />
          {/* News Cards */}
          {safeNewsData.map((news, i) => (
            <NewsCard
              key={`news-${i}`}
              title={news.title}
              source={news.source}
              image={news.image}
              publishedAt={news.publishedAt}
              url={news.url}
              loading={loading}
              className="h-64"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 