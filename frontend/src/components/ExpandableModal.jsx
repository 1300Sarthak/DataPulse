import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip, Spinner } from "@heroui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ExpandableModal = ({ 
  isOpen, 
  onClose, 
  data = null,
  loading = false 
}) => {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState("24h");
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  const timeRanges = [
    { key: "1h", label: "1H" },
    { key: "24h", label: "24H" },
    { key: "7d", label: "7D" },
    { key: "1y", label: "1Y" }
  ];

  // Fetch chart data
  const fetchChartData = async () => {
    if (!data) return;

    setIsLoadingChart(true);
    setChartError(null);

    try {
      let url;
      let response;

      if (data.type === "crypto") {
        // CoinGecko API for crypto
        const days = timeRange === "1h" ? 1 : 
                    timeRange === "24h" ? 1 : 
                    timeRange === "7d" ? 7 : 365;
        
        url = `https://api.coingecko.com/api/v3/coins/${data.symbol.toLowerCase()}/market_chart?vs_currency=usd&days=${days}`;
        response = await fetch(url);
      } else {
        // Finnhub API for stocks
        const now = Math.floor(Date.now() / 1000);
        let from;
        
        switch (timeRange) {
          case "1h":
            from = now - (60 * 60); // 1 hour
            break;
          case "24h":
            from = now - (24 * 60 * 60); // 24 hours
            break;
          case "7d":
            from = now - (7 * 24 * 60 * 60); // 7 days
            break;
          case "1y":
            from = now - (365 * 24 * 60 * 60); // 1 year
            break;
          default:
            from = now - (24 * 60 * 60);
        }

        url = `https://finnhub.io/api/v1/stock/candle?symbol=${data.symbol}&resolution=5&from=${from}&to=${now}&token=${import.meta.env.VITE_FINNHUB_API_KEY}`;
        response = await fetch(url);
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const apiData = await response.json();
      let processedData = [];

      if (data.type === "crypto") {
        // Process CoinGecko data
        processedData = apiData.prices.map(([timestamp, price]) => ({
          time: new Date(timestamp).toLocaleTimeString(),
          price: price
        }));
      } else {
        // Process Finnhub data
        if (apiData.s === "ok") {
          processedData = apiData.t.map((timestamp, index) => ({
            time: new Date(timestamp * 1000).toLocaleTimeString(),
            price: apiData.c[index]
          }));
        } else {
          throw new Error("No data available");
        }
      }

      setChartData(processedData);
    } catch (error) {
      console.error("Chart fetch error:", error);
      setChartError("Failed to load chart data");
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Fetch chart data when modal opens or time range changes
  useEffect(() => {
    if (isOpen && data) {
      fetchChartData();
    }
  }, [isOpen, data, timeRange]);

  // Format price for tooltip
  const formatPrice = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Custom tooltip
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

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="4xl"
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {data?.title} ({data?.symbol})
              </h2>
              <p className="text-sm text-gray-500">
                {data?.type === "crypto" ? "Cryptocurrency" : "Stock"} Price Chart
              </p>
            </div>
            <Chip 
              size="sm" 
              color={data?.type === "crypto" ? "warning" : "primary"}
              variant="flat"
            >
              {data?.type === "crypto" ? "Crypto" : "Stock"}
            </Chip>
          </div>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Time Range Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Time Range:
                </span>
                <div className="flex gap-1">
                  {timeRanges.map((range) => (
                    <Button
                      key={range.key}
                      size="sm"
                      variant={timeRange === range.key ? "solid" : "bordered"}
                      color={timeRange === range.key ? "primary" : "default"}
                      onClick={() => setTimeRange(range.key)}
                      className="min-w-12"
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-96 w-full">
                {isLoadingChart ? (
                  <div className="flex items-center justify-center h-full">
                    <Spinner size="lg" />
                    <span className="ml-3 text-gray-500">Loading chart...</span>
                  </div>
                ) : chartError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-red-500 mb-2">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm">{chartError}</p>
                      </div>
                      <Button
                        size="sm"
                        color="primary"
                        onClick={fetchChartData}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#6B7280"
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                        tickFormatter={(value) => formatPrice(value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#3B82F6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No chart data available</p>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Current Price</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data.price ? formatPrice(data.price) : "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">24h Change</p>
                    <p className={`text-lg font-semibold ${data.change > 0 ? 'text-green-600' : data.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {data.change ? `${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Market Cap</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      $1.2T
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Volume</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      24.5M
                    </p>
                  </div>
                </div>
              )}
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

export default ExpandableModal; 