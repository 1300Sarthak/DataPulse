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
  size = "md",
  onClick,
  loading = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);

  // Determine card dimensions based on size
  const getSizeClasses = () => {
    switch (size) {
      case "lg":
        return "w-80 h-64"; // Large cards
      case "md":
        return "w-64 h-48"; // Medium cards
      case "sm":
        return "w-48 h-40"; // Small cards
      default:
        return "w-64 h-48";
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

  // Get change color
  const getChangeColor = () => {
    if (typeof change === "number") {
      return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600";
    }
    return "text-gray-600";
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
        className={`${getSizeClasses()} rounded-3xl shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer animate-pulse`}
      >
        <CardBody className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className={`${getSizeClasses()} rounded-3xl shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${
          isHovered ? 'shadow-xl' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <CardBody className="p-6 h-full">
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
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          ) : (
            // Crypto/Stock card layout
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500">{symbol}</p>
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
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatPrice(price)}
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${getChangeColor()}`}>
                  {getChangeIcon()}
                  <span>{formatChange(change)}</span>
                </div>
              </div>

              {/* Additional info for large cards */}
              {size === "lg" && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Market Cap: $1.2T</div>
                    <div>Volume: 24.5M</div>
                  </div>
                </div>
              )}

              {/* Click hint for crypto/stock cards */}
              {(type === "crypto" || type === "stock") && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Click to view chart
                </div>
              )}
            </div>
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