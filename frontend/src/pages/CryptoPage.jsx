import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  ButtonGroup,
  Spinner,
  Chip,
  Divider,
  Select,
  SelectItem,
  Badge
} from "@heroui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import apiService from "../services/api";

const TIME_RANGES = [
  { key: "1", label: "24h" },
  { key: "7", label: "7d" },
  { key: "30", label: "30d" },
  { key: "365", label: "1y" },
  { key: "max", label: "All" }
];

const TOP_OPTIONS = [25, 50, 100];

// Crypto icons mapping
const CRYPTO_ICONS = {
  'BTC': '₿',
  'ETH': 'Ξ',
  'USDT': '₮',
  'USDC': '💲',
  'BNB': '🟡',
  'XRP': '✖',
  'ADA': '₳',
  'SOL': '◎',
  'DOT': '●',
  'DOGE': '🐕',
  'AVAX': '❄️',
  'MATIC': '🔷',
  'LINK': '🔗',
  'UNI': '🦄',
  'LTC': 'Ł',
  'BCH': '₿',
  'ETC': 'Ξ',
  'XLM': '⭐',
  'ATOM': '⚛️',
  'NEAR': '🌐'
};

const CryptoPage = () => {
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topN, setTopN] = useState(50);
  const [timeRange, setTimeRange] = useState("1");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch crypto list
  const fetchCryptos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCryptoPrices(topN);
      console.log('Crypto data received:', data.slice(0, 3)); // Show first 3 items
      if (data.length > 0) {
        console.log('First crypto object structure:', data[0]);
      }
      if (Array.isArray(data)) {
        setCryptos(data);
        // Set Bitcoin as default selected crypto
        if (data.length > 0 && !selectedCrypto) {
          console.log('Setting default crypto:', data[0]);
          setSelectedCrypto(data[0]);
        }
      } else {
        setError("Unexpected response from server.");
        setCryptos([]);
      }
    } catch (err) {
      setError(err.message);
      setCryptos([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chart data
  const fetchChartData = async (crypto, range) => {
    if (!crypto) return;
    
    setChartLoading(true);
    try {
      console.log('Fetching chart data for:', crypto.symbol, 'range:', range);
      const data = await apiService.getCryptoHistoricalData(crypto.symbol, range);
      console.log('Chart data response:', data);
      if (data && data.prices && data.prices.length > 0) {
        const formattedData = data.prices.map(item => ({
          time: new Date(item.timestamp).toLocaleDateString(),
          price: item.price,
          timestamp: item.timestamp
        }));
        setChartData(formattedData);
      } else {
        console.log('No chart data available');
        setChartData([]);
      }
    } catch (err) {
      console.error("Chart data fetch error for", crypto.symbol, ":", err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  // Handle crypto selection
  const handleCryptoSelect = (crypto) => {
    console.log('Crypto selected:', crypto);
    setSelectedCrypto(crypto);
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Format price
  const formatPrice = (value) => {
    if (!value) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  // Format change percentage
  const formatChange = (value) => {
    if (typeof value === 'number') {
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}%`;
    }
    return "0.00%";
  };

  // Get change color
  const getChangeColor = (change) => {
    if (typeof change === 'number') {
      return change > 0 ? "success" : change < 0 ? "danger" : "default";
    }
    return "default";
  };

  // Get crypto icon
  const getCryptoIcon = (symbol) => {
    return CRYPTO_ICONS[symbol] || '💎';
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Effects
  useEffect(() => {
    fetchCryptos();
  }, [topN]);

  useEffect(() => {
    if (selectedCrypto) {
      fetchChartData(selectedCrypto, timeRange);
    }
  }, [selectedCrypto, timeRange]);

  return (
    <div className="pt-2 pb-6 px-6">
      {/* Hero Section */}
      <div className="max-w-screen-2xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors mb-1">
              Crypto Dashboard
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-100 transition-colors">
              Track cryptocurrency prices and market trends in real-time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label htmlFor="crypto-count-select" className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Top Cryptocurrencies</label>
              <Select
                id="crypto-count-select"
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="w-48 min-w-48"
                variant="bordered"
                color="primary"
                size="sm"
                classNames={{
                  base: "bg-white dark:bg-gray-800",
                  trigger: "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700",
                  value: "text-gray-900 dark:text-white font-medium"
                }}
              >
                {TOP_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt} textValue={`Top ${opt}`}>
                    Top {opt}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Side - Chart (65%) */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedCrypto ? `${selectedCrypto.name} (${selectedCrypto.symbol})` : 'Select a cryptocurrency'}
                    </h2>
                    {selectedCrypto && (
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatPrice(selectedCrypto.price)}
                      </p>
                    )}
                  </div>
                  <ButtonGroup size="sm">
                    {TIME_RANGES.map(({ key, label }) => (
                      <Button
                        key={key}
                        color={timeRange === key ? "primary" : "default"}
                        variant={timeRange === key ? "solid" : "bordered"}
                        onClick={() => handleTimeRangeChange(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {!selectedCrypto ? (
                  <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                      <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Select a cryptocurrency to view its price chart
                      </p>
                    </div>
                  </div>
                ) : chartLoading ? (
                  <div className="flex items-center justify-center h-80">
                    <Spinner size="lg" />
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="h-80 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#374151" 
                          strokeOpacity={0.3}
                        />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6B7280"
                          fontSize={12}
                          tick={{ fill: '#6B7280' }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                          tick={{ fill: '#6B7280' }}
                          tickFormatter={(value) => formatPrice(value)}
                          domain={['dataMin - 1%', 'dataMax + 1%']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#colorPrice)"
                          dot={false}
                          activeDot={{ 
                            r: 6, 
                            fill: "#3b82f6",
                            stroke: "#fff",
                            strokeWidth: 2
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                      <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No chart data available for this time period
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right Side - Crypto List (35%) */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cryptocurrencies
                </h2>
              </CardHeader>
              <CardBody className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-80">
                    <Spinner size="lg" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                      <p className="text-red-500 mb-4">{error}</p>
                      <Button color="primary" onClick={fetchCryptos}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-3 max-h-[600px] overflow-y-auto">
                    {cryptos.map((crypto) => {
                      const isSelected = selectedCrypto?.symbol === crypto.symbol;
                      const change = Math.random() * 20 - 10; // Mock change for now
                      
                      return (
                        <Card
                          key={crypto.symbol}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={(e) => {
                            console.log('Card clicked for:', crypto.symbol, crypto);
                            e.preventDefault();
                            e.stopPropagation();
                            handleCryptoSelect(crypto);
                          }}
                        >
                          <CardBody className="p-3">
                            <div 
                              onClick={(e) => {
                                console.log('CardBody clicked for:', crypto.symbol, crypto);
                                e.preventDefault();
                                e.stopPropagation();
                                handleCryptoSelect(crypto);
                              }}
                              className="w-full h-full"
                            >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {getCryptoIcon(crypto.symbol)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                    {crypto.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                                    {crypto.symbol}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                  {formatPrice(crypto.price)}
                                </p>
                                <div className="flex items-center gap-0.5">
                                  {change > 0 ? (
                                    <ArrowTrendingUpIcon className="w-2 h-2 text-green-500" />
                                  ) : (
                                    <ArrowTrendingDownIcon className="w-2 h-2 text-red-500" />
                                  )}
                                  <Chip
                                    size="sm"
                                    color={getChangeColor(change)}
                                    variant="flat"
                                    className="text-xs"
                                  >
                                    {formatChange(change)}
                                  </Chip>
                                </div>
                              </div>
                            </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoPage; 