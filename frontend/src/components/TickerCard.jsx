import React, { useState } from "react";
import { Card, CardHeader, CardBody, Skeleton, Chip, Button } from "@heroui/react";
import ChartModal from "./ChartModal";

/**
 * TickerCard component
 * @param {string} title - The ticker symbol (e.g., BTC, AAPL)
 * @param {number|string} value - The current price/value
 * @param {string} type - 'crypto' or 'stock'
 * @param {boolean} loading - Whether to show the skeleton loader
 * @param {number} [change] - Optional price change (positive/negative)
 */
const TickerCard = ({ title, value, type, loading = false, change }) => {
  const [isChartOpen, setIsChartOpen] = useState(false);

  // Determine color based on price movement
  let color = "text-gray-800 dark:text-gray-100";
  if (typeof change === "number") {
    color = change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : color;
  }

  // Format value
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value;

  // Format change
  const formattedChange =
    typeof change === "number"
      ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%`
      : null;

  const handleCardClick = () => {
    if (!loading) {
      setIsChartOpen(true);
    }
  };

  return (
    <>
      <Card 
        className="w-full max-w-xs mx-auto cursor-pointer hover:shadow-lg transition-shadow duration-200"
        isPressable={!loading}
        onPress={handleCardClick}
      >
        <CardHeader className="flex items-center gap-2">
          <span className="font-semibold text-lg">{title}</span>
          <Chip size="sm" color={type === "crypto" ? "warning" : "primary"}>
            {type === "crypto" ? "Crypto" : "Stock"}
          </Chip>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          ) : (
            <div className="flex flex-col items-start">
              <span className={`text-2xl font-bold ${color}`}>{formattedValue}</span>
              {formattedChange && (
                <span className={`text-sm font-medium ${color}`}>{formattedChange}</span>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Click to view chart
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <ChartModal
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        symbol={title}
        type={type}
      />
    </>
  );
};

export default TickerCard; 