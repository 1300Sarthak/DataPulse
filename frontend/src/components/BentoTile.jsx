import React from "react";
import { Card, CardBody, Chip } from "@heroui/react";

const BentoTile = ({ 
  title, 
  symbol, 
  price, 
  change, 
  type = "stock", 
  size = "md",
  loading = false 
}) => {
  // Determine grid classes based on size
  const getGridClasses = () => {
    switch (size) {
      case "lg":
        return "col-span-2 row-span-2";
      case "md":
        return "col-span-1 row-span-2";
      case "sm":
        return "col-span-1 row-span-1";
      default:
        return "col-span-1 row-span-1";
    }
  };

  // Format price
  const formatPrice = (value) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return value;
  };

  // Format change percentage
  const formatChange = (value) => {
    if (typeof value === "number") {
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}%`;
    }
    return value;
  };

  // Determine color based on price movement
  const getChangeColor = () => {
    if (typeof change === "number") {
      return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400";
    }
    return "text-gray-600 dark:text-gray-400";
  };

  // Get change icon
  const getChangeIcon = () => {
    if (typeof change === "number") {
      if (change > 0) {
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      } else if (change < 0) {
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={`${getGridClasses()} rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200`}>
        <CardBody className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`${getGridClasses()} rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200 cursor-pointer`}>
      <CardBody className="p-4">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{symbol}</p>
            </div>
            <Chip 
              size="sm" 
              color={type === "crypto" ? "warning" : "primary"}
              variant="flat"
            >
              {type === "crypto" ? "Crypto" : "Stock"}
            </Chip>
          </div>

          {/* Price and Change */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatPrice(price)}
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className={getChangeColor()}>{formatChange(change)}</span>
            </div>
          </div>

          {/* Additional info for larger tiles */}
          {size === "lg" && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Market Cap: $1.2T
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Volume: 24.5M
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default BentoTile; 