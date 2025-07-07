import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Chip,
  Divider
} from "@heroui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import apiService from "../services/api";

const ChartModal = ({ isOpen, onClose, symbol, type }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(type === "crypto" ? "1" : "1D");
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  // Enhanced time periods for both crypto and stocks
  const cryptoPeriods = [
    { key: "1", label: "1 Day" },
    { key: "7", label: "7 Days" },
    { key: "30", label: "1 Month" },
    { key: "90", label: "3 Months" },
    { key: "365", label: "1 Year" },
    { key: "1825", label: "5 Years" },
    { key: "max", label: "Max" }
  ];

  const stockPeriods = [
    { key: "1H", label: "1 Hour" },
    { key: "1D", label: "1 Day" },
    { key: "1W", label: "1 Week" },
    { key: "1M", label: "1 Month" },
    { key: "3M", label: "3 Months" },
    { key: "1Y", label: "1 Year" }
  ];

  const periods = type === "crypto" ? cryptoPeriods : stockPeriods;

  const fetchData = async (period) => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const result = type === "crypto" 
        ? await apiService.getCryptoHistoricalData(symbol, period)
        : await apiService.getStockHistoricalData(symbol, period);
      
      if (!result || !result.prices || result.prices.length === 0) {
        throw new Error("No data available for this time period");
      }

      // Transform data for chart
      const chartData = result.prices.map(item => ({
        time: new Date(item.timestamp).toLocaleString(),
        price: type === "crypto" ? item.price : item.close,
        timestamp: item.timestamp,
        date: new Date(item.timestamp)
      }));

      // Sort by timestamp to ensure chronological order
      chartData.sort((a, b) => a.timestamp - b.timestamp);

      setData(chartData);

      // Calculate current price and change
      if (chartData.length > 0) {
        const latest = chartData[chartData.length - 1];
        const earliest = chartData[0];
        setCurrentPrice(latest.price);
        
        if (earliest.price > 0) {
          const change = ((latest.price - earliest.price) / earliest.price) * 100;
          setPriceChange(change);
        }
      }

    } catch (err) {
      setError(err.message || "Failed to load chart data");
      console.error("Chart data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && symbol) {
      fetchData(selectedPeriod);
    }
  }, [isOpen, symbol, selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const formatPrice = (value) => {
    if (!value) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatChange = (change) => {
    if (change === null || change === undefined) return null;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change) => {
    if (change === null || change === undefined) return "text-gray-500 dark:text-gray-400";
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatXAxisTick = (tickItem) => {
    if (!tickItem) return "";
    const date = new Date(tickItem);
    
    // Format based on selected period
    if (selectedPeriod === "1H") {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (selectedPeriod === "1D") {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (selectedPeriod === "1W" || selectedPeriod === "7") {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="5xl" 
      scrollBehavior="inside"
      classNames={{
        base: "bg-white dark:bg-gray-900",
        header: "border-b border-gray-200 dark:border-gray-700",
        body: "py-6",
        footer: "border-t border-gray-200 dark:border-gray-700"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {symbol}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {type === "crypto" ? "Cryptocurrency" : "Stock"} Price Chart
                </p>
              </div>
              <Chip 
                size="sm" 
                color={type === "crypto" ? "warning" : "primary"}
                variant="flat"
              >
                {type === "crypto" ? "Crypto" : "Stock"}
              </Chip>
            </div>
            
            {/* Current Price Display */}
            {currentPrice && (
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(currentPrice)}
                </div>
                {priceChange !== null && (
                  <div className={`text-sm font-medium ${getChangeColor(priceChange)}`}>
                    {formatChange(priceChange)}
                  </div>
                )}
              </div>
            )}
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Time Period Selector */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <Button
                  key={period.key}
                  size="sm"
                  variant={selectedPeriod === period.key ? "solid" : "bordered"}
                  color={type === "crypto" ? "warning" : "primary"}
                  onClick={() => handlePeriodChange(period.key)}
                  className="min-w-16"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          <Divider className="mb-6" />

          {/* Chart */}
          <div className="w-full h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size="lg" color={type === "crypto" ? "warning" : "primary"} />
                  <p className="mt-3 text-gray-500 dark:text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-lg font-medium">Failed to load chart</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
                  </div>
                  <Button
                    size="sm"
                    color={type === "crypto" ? "warning" : "primary"}
                    onClick={() => fetchData(selectedPeriod)}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={type === "crypto" ? "#F59E0B" : "#3B82F6"} 
                        stopOpacity={0.3}
                      />
                      <stop 
                        offset="95%" 
                        stopColor={type === "crypto" ? "#F59E0B" : "#3B82F6"} 
                        stopOpacity={0.1}
                      />
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
                    tickFormatter={formatXAxisTick}
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
                    stroke={type === "crypto" ? "#F59E0B" : "#3B82F6"}
                    strokeWidth={2}
                    fill={`url(#color${type})`}
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      fill: type === "crypto" ? "#F59E0B" : "#3B82F6",
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Chart Info */}
          {data && data.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Data Points</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{data.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Time Range</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {data[0].date.toLocaleDateString()} - {data[data.length - 1].date.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Low</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(Math.min(...data.map(d => d.price)))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">High</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(Math.max(...data.map(d => d.price)))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChartModal; 