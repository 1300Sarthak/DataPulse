import React from "react";
import { Card, CardBody, Chip } from "@heroui/react";

const ExchangeRateCard = ({ 
  rates, 
  loading = false 
}) => {
  const formatRate = (rate) => {
    if (typeof rate === "number") {
      return rate.toFixed(4);
    }
    return rate;
  };

  const getChangeColor = (change) => {
    if (typeof change === "number") {
      return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400";
    }
    return "text-gray-600 dark:text-gray-400";
  };

  const getChangeIcon = (change) => {
    if (typeof change === "number") {
      if (change > 0) {
        return (
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      } else if (change < 0) {
        return (
          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="col-span-1 row-span-1 rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200">
        <CardBody className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 row-span-1 rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200">
      <CardBody className="p-4">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Exchange Rates
            </h3>
            <Chip size="sm" color="secondary" variant="flat">
              USD
            </Chip>
          </div>

          {/* Rates */}
          <div className="flex-1 space-y-3">
            {rates?.USD_EUR && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">EUR</span>
                  {getChangeIcon(0.5)} {/* Mock change */}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatRate(rates.USD_EUR)}
                  </div>
                  <div className={`text-xs ${getChangeColor(0.5)}`}>
                    +0.5%
                  </div>
                </div>
              </div>
            )}

            {rates?.USD_INR && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">INR</span>
                  {getChangeIcon(-0.2)} {/* Mock change */}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatRate(rates.USD_INR)}
                  </div>
                  <div className={`text-xs ${getChangeColor(-0.2)}`}>
                    -0.2%
                  </div>
                </div>
              </div>
            )}

            {/* Mini chart placeholder */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>24h Change</span>
                <span className="text-green-600">+0.15%</span>
              </div>
              {/* Simple bar chart */}
              <div className="mt-2 flex items-end gap-1 h-8">
                {[0.8, 0.6, 0.9, 0.7, 0.8, 0.6, 0.9].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-sm"
                    style={{ height: `${height * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ExchangeRateCard; 