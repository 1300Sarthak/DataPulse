import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  ButtonGroup,
  Spinner,
  Chip,
  Select,
  SelectItem
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
  ChartBarIcon
} from "@heroicons/react/24/outline";
import apiService from "../services/api";

const TIME_RANGES = [
  { key: "1D", label: "1D" },
  { key: "7D", label: "7D" },
  { key: "1M", label: "1M" },
  { key: "1Y", label: "1Y" },
  { key: "MAX", label: "All" }
];

const TOP_OPTIONS = [10, 15, 20, 25];

// Stock icons mapping (simple emoji for demo)
const STOCK_ICONS = {
  'AAPL': '🍏',
  'TSLA': '🚗',
  'GOOGL': '🔍',
  'MSFT': '🪟',
  'AMZN': '📦',
  'NVDA': '💻',
  'META': '📘',
  'NFLX': '🎬',
  'BRK.A': '🏦',
  'JPM': '💰',
  'V': '💳',
  'UNH': '🏥',
  'HD': '🏠',
  'PG': '🧼',
  'DIS': '🏰',
  'MA': '💳',
  'BAC': '🏦',
  'XOM': '⛽',
  'PFE': '💊',
  'KO': '🥤',
  'PEP': '🥤',
  'CSCO': '🌐',
  'ABT': '🏥',
  'TMO': '🔬',
  'AVGO': '💻',
  'COST': '🛒',
  'WMT': '🛒',
  'CVX': '⛽',
  'MCD': '🍔',
  'DHR': '🏭',
  'LLY': '💊',
  'ACN': '💼',
  'LIN': '🏭',
  'MRK': '💊',
  'CRM': '💻',
  'INTC': '💻',
  'TXN': '💻',
  'NEE': '⚡',
  'NKE': '👟',
  'MDT': '🏥',
  'HON': '🏭',
  'UNP': '🚂',
  'AMGN': '💊',
  'QCOM': '📱',
  'LOW': '🔨',
  'MS': '💰',
  'SBUX': '☕',
  'IBM': '💻',
  'AMD': '💻',
  'GS': '💰',
  'CAT': '🚜',
  'DE': '🚜',
  'RTX': '✈️',
  'SPGI': '📊',
  'T': '📞',
  'VZ': '📱',
  'CMCSA': '📺',
  'ADBE': '🎨',
  'PM': '🚬',
  'UPS': '📦'
};

const StocksPage = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topN, setTopN] = useState(10);
  const [timeRange, setTimeRange] = useState("1D");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get the currently selected stock object
  const selectedStock = stocks.find(stock => stock.symbol === selectedStockSymbol);

  // Fetch top N stocks from backend
  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getStockList(topN);
      setStocks(data);
      // Try to preserve the selected stock if it exists in the new list
      if (data.length > 0) {
        const found = selectedStockSymbol && data.find(s => s.symbol === selectedStockSymbol);
        setSelectedStockSymbol(found ? found.symbol : data[0].symbol);
      } else {
        setSelectedStockSymbol(null);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      if (error.message?.includes('rate limit') || error.status === 429) {
        setError('API rate limit exceeded. Please try again in a minute.');
      } else {
        setError('Failed to fetch stocks. Please try again.');
      }
      setStocks([]);
      setSelectedStockSymbol(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chart data
  const fetchChartData = async (symbol, range) => {
    if (!symbol) return;
    console.log('Fetching chart data for:', symbol, 'range:', range);
    setChartLoading(true);
    try {
      const data = await apiService.getStockHistoricalData(symbol, range);
      console.log('Chart data received:', data);
      if (data && data.prices && data.prices.length > 0) {
        const formattedData = data.prices.map(item => ({
          time: new Date(item.timestamp).toLocaleDateString(),
          price: item.close || item.price,
          timestamp: item.timestamp
        }));
        console.log('Formatted chart data:', formattedData.slice(0, 3));
        setChartData(formattedData);
      } else {
        console.log('No chart data available');
        setChartData([]);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      if (error.message?.includes('rate limit') || error.status === 429) {
        console.warn('Rate limit exceeded for chart data');
      }
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  // Handle stock selection
  const handleStockSelect = (stock) => {
    console.log('Stock selected:', stock.symbol);
    setSelectedStockSymbol(stock.symbol);
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    console.log('Time range changed to:', range);
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

  // Format change percentage (mocked for now)
  const formatChange = (value) => {
    if (typeof value === 'number') {
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}%`;
    }
    return "0.00%";
  };

  // Get change color (mocked for now)
  const getChangeColor = (change) => {
    if (typeof change === 'number') {
      return change > 0 ? "success" : change < 0 ? "danger" : "default";
    }
    return "default";
  };

  // Get stock icon
  const getStockIcon = (symbol) => {
    return STOCK_ICONS[symbol] || '💹';
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

  useEffect(() => {
    fetchStocks();
    // eslint-disable-next-line
  }, [topN]);

  useEffect(() => {
    if (selectedStockSymbol) {
      console.log('useEffect triggered - selectedStockSymbol changed to:', selectedStockSymbol);
      fetchChartData(selectedStockSymbol, timeRange);
    } else {
      console.log('useEffect triggered - no selectedStockSymbol');
    }
    // eslint-disable-next-line
  }, [selectedStockSymbol, timeRange]);

  return (
    <div className="pt-2 pb-6 px-6">
      {/* Hero Section */}
      <div className="max-w-screen-2xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors mb-1">
              Stocks Dashboard
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-100 transition-colors">
              Track stock prices and market trends in real-time
            </p>
          </div>
          <div className="flex flex-col">
            <label htmlFor="stock-count-select" className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Top Stocks</label>
            <Select
              id="stock-count-select"
              aria-label="Select number of top stocks to display"
              selectedKeys={[topN.toString()]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setTopN(parseInt(value));
              }}
              className="w-32"
              variant="bordered"
              color="primary"
              size="sm"
              classNames={{
                base: "bg-white dark:bg-gray-800",
                trigger: "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700",
                value: "text-gray-900 dark:text-white font-medium"
              }}
            >
              {TOP_OPTIONS.map((option) => (
                <SelectItem key={option.toString()} value={option.toString()} textValue={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </Select>
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
                      {selectedStock ? `${selectedStock.name} (${selectedStock.symbol})` : 'Select a stock'}
                    </h2>
                    {selectedStock && (
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatPrice(selectedStock.price)}
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
                {!selectedStock ? (
                  <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                      <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Select a stock to view its price chart
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
          {/* Right Side - Stock List (35%) */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Stocks
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
                      <Button color="primary" onClick={fetchStocks}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-3 max-h-[600px] overflow-y-auto">
                    {stocks.map((stock) => {
                      const isSelected = selectedStockSymbol === stock.symbol;
                      const change = Math.random() * 4 - 2; // Mock change for now
                      return (
                        <Card
                          key={stock.symbol}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => {
                            console.log('Card clicked for stock:', stock.symbol);
                            handleStockSelect(stock);
                          }}
                        >
                          <CardBody className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {getStockIcon(stock.symbol)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                    {stock.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                                    {stock.symbol}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                  {formatPrice(stock.price)}
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

export default StocksPage; 