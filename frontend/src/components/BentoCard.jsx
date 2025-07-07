import React, { useState } from "react";
import { Card, CardBody, Chip, Button } from "@heroui/react";
import ChartModal from "./ChartModal";

const BentoCard = ({ 
  type = "crypto",
  title, 
  symbol, 
  price, 
  change, 
  image,
  url,
  onClick,
  loading = false,
  className = ""
}) => {
  const [isChartOpen, setIsChartOpen] = useState(false);

  // Determine card dimensions based on size
  const getSizeClasses = () => {
    // Use responsive grid classes instead of fixed sizes
    return "col-span-1 row-span-1";
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

  // Get change color
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

  // Handle card click
  const handleClick = () => {
    if (type === "news" && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if ((type === "crypto" || type === "stock") && symbol) {
      setIsChartOpen(true);
    } else if (onClick) {
      onClick({ type, symbol, title });
    }
  };

  if (loading) {
    return (
      <Card 
        className={`${getSizeClasses()} rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200 animate-pulse card-light dark:card-dark`}
      >
        <CardBody className="p-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className={`${getSizeClasses()} rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200 cursor-pointer card-light dark:card-dark ${className}`}
        onClick={handleClick}
      >
        <CardBody className="p-4 flex flex-col h-full">
          {type === "news" ? (
            // News card layout
            <div className="flex flex-col h-full">
              {image && (
                <div className="relative mb-4">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-24 object-cover rounded-2xl"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x150?text=News";
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                    {symbol}
                  </div>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
                  {title}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          ) : (
            // Crypto/Stock card layout
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{symbol}</p>
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
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                  {formatPrice(price)}
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${getChangeColor()}`}>
                  {getChangeIcon()}
                  <span>{formatChange(change)}</span>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Chart Modal for crypto and stock cards */}
      {(type === "crypto" || type === "stock") && (
        <ChartModal
          isOpen={isChartOpen}
          onClose={() => setIsChartOpen(false)}
          symbol={symbol}
          type={type}
        />
      )}
    </>
  );
};

export default BentoCard; 