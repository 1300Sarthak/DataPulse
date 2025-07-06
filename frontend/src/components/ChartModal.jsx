import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Spinner,
  Chip
} from "@heroui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ChartModal = ({ isOpen, onClose, symbol, type }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(type === "crypto" ? "1" : "1D");

  const cryptoPeriods = [
    { key: "1", label: "1 Day" },
    { key: "7", label: "7 Days" },
    { key: "30", label: "1 Month" },
    { key: "90", label: "3 Months" },
    { key: "365", label: "1 Year" },
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
      const endpoint = type === "crypto" 
        ? `/api/crypto/historical/${symbol}?days=${period}`
        : `/api/stocks/historical/${symbol}?period=${period}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Transform data for chart
      const chartData = result.prices.map(item => ({
        time: new Date(item.timestamp).toLocaleString(),
        price: type === "crypto" ? item.price : item.close,
        timestamp: item.timestamp
      }));

      setData(chartData);
    } catch (err) {
      setError(err.message);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{symbol}</span>
            <Chip size="sm" color={type === "crypto" ? "warning" : "primary"}>
              {type === "crypto" ? "Crypto" : "Stock"}
            </Chip>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Historical Price Chart
          </p>
        </ModalHeader>
        <ModalBody>
          {/* Time Period Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {periods.map((period) => (
              <Button
                key={period.key}
                size="sm"
                variant={selectedPeriod === period.key ? "solid" : "bordered"}
                color={type === "crypto" ? "warning" : "primary"}
                onClick={() => handlePeriodChange(period.key)}
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <div className="w-full h-96">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" color={type === "crypto" ? "warning" : "primary"} />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-500 mb-2">Error loading chart</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                </div>
              </div>
            ) : data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tick={{ fill: '#9CA3AF' }}
                    tickFormatter={(value) => formatPrice(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={type === "crypto" ? "#F59E0B" : "#3B82F6"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: type === "crypto" ? "#F59E0B" : "#3B82F6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-400">No data available</p>
              </div>
            )}
          </div>
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