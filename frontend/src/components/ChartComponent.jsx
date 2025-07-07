import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, ButtonGroup } from "@heroui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApiService } from '../services/api';

const ChartComponent = ({ symbol = "BTC", initialPeriod = "1h" }) => {
  const apiService = useApiService();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(initialPeriod);
  const [error, setError] = useState(null);

  const periods = [
    { key: "1h", label: "1H" },
    { key: "24h", label: "24H" },
    { key: "7d", label: "7D" },
  ];

  // Generate mock data for development
  const generateMockData = (periodKey, basePrice = 50000) => {
    const now = new Date();
    const dataPoints = periodKey === "1h" ? 60 : periodKey === "24h" ? 24 : 7;
    const interval = periodKey === "1h" ? 1 : periodKey === "24h" ? 60 : 1440; // minutes

    return Array.from({ length: dataPoints }, (_, i) => {
      const time = new Date(now.getTime() - (dataPoints - i) * interval * 60000);
      const price = basePrice + Math.sin(i * 0.5) * 1000 + (Math.random() - 0.5) * 2000;
      return {
        time: time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        price: Math.max(price, 1000), // Ensure price doesn't go below $1000
      };
    });
  };

  const fetchData = async (periodKey) => {
    setLoading(true);
    setError(null);

    try {
      // Get current crypto prices and generate historical data
      const cryptoData = await apiService.getCryptoPrices();
      const currentPrice = cryptoData[symbol] || 50000;
      
      // Generate mock historical data based on current price
      const mockData = generateMockData(periodKey, currentPrice);
      setData(mockData);
    } catch (err) {
      setError("Failed to load chart data");
      console.error("Chart data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardBody>
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button 
              color="primary" 
              size="sm" 
              className="mt-2"
              onClick={() => fetchData(period)}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{symbol} Price History</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {period === "1h" ? "Last hour" : period === "24h" ? "Last 24 hours" : "Last 7 days"}
          </p>
        </div>
        <ButtonGroup size="sm">
          {periods.map(({ key, label }) => (
            <Button
              key={key}
              color={period === key ? "primary" : "default"}
              variant={period === key ? "solid" : "bordered"}
              onClick={() => handlePeriodChange(key)}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatPrice}
              />
              <Tooltip
                formatter={(value) => [formatPrice(value), "Price"]}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  );
};

export default ChartComponent; 