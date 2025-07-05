import React, { useState, useEffect, useRef } from "react";
import { Button, Spinner, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { useApiService } from '../services/api';

// Error Boundary for RefreshButton
class RefreshErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RefreshButton Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-2">
          <div className="text-red-500 text-sm mb-1">
            <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Refresh failed
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-blue-500 hover:text-blue-700 text-xs underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const RefreshButton = ({ onRefresh, className = "" }) => {
  const apiService = useApiService();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // seconds
  const [nextAutoRefresh, setNextAutoRefresh] = useState(0);
  
  const intervalRef = useRef(null);
  const autoRefreshCountdownRef = useRef(null);

  const intervals = [
    { value: 15, label: "15s" },
    { value: 30, label: "30s" },
    { value: 60, label: "1m" },
    { value: 300, label: "5m" },
  ];

  // Countdown timer for disabled state
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (autoRefresh && nextAutoRefresh > 0) {
      autoRefreshCountdownRef.current = setInterval(() => {
        setNextAutoRefresh(prev => {
          if (prev <= 1) {
            handleRefresh();
            return autoRefreshInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (autoRefreshCountdownRef.current) {
        clearInterval(autoRefreshCountdownRef.current);
      }
    };
  }, [autoRefresh, autoRefreshInterval]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        handleRefresh();
      }, autoRefreshInterval * 1000);
      
      setNextAutoRefresh(autoRefreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setNextAutoRefresh(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, autoRefreshInterval]);

  const handleRefresh = async () => {
    if (isLoading || isDisabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call the refresh endpoint
      const response = await apiService.refresh();

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      // Trigger re-render of all components
      if (onRefresh) {
        onRefresh();
      }

      // Disable button for 5 seconds (only for manual refresh)
      if (!autoRefresh) {
        setIsDisabled(true);
        setCountdown(5);
      }

    } catch (err) {
      setError(err.message);
      console.error("Refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoRefreshToggle = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      // Starting auto-refresh, trigger first refresh immediately
      handleRefresh();
    }
  };

  const handleIntervalChange = (newInterval) => {
    setAutoRefreshInterval(newInterval);
    if (autoRefresh) {
      setNextAutoRefresh(newInterval);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Refreshing...";
    if (isDisabled) return `Refresh (${countdown}s)`;
    if (autoRefresh && nextAutoRefresh > 0) return `Auto (${nextAutoRefresh}s)`;
    return "Refresh";
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Spinner size="sm" color="current" />;
    }
    if (autoRefresh) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    );
  };

  if (error) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-red-500 text-sm mb-2">
          <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          onClick={handleRefresh}
          disabled={isLoading || isDisabled}
        >
          {getButtonIcon()}
          Retry Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Auto-refresh toggle */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Auto</span>
        <Switch
          size="sm"
          isSelected={autoRefresh}
          onValueChange={handleAutoRefreshToggle}
          color="primary"
        />
      </div>

      {/* Interval selector */}
      {autoRefresh && (
        <Dropdown>
          <DropdownTrigger>
            <Button size="sm" variant="bordered" className="min-w-0 px-2">
              {intervals.find(i => i.value === autoRefreshInterval)?.label || "30s"}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Auto-refresh intervals"
            onAction={(key) => handleIntervalChange(Number(key))}
          >
            {intervals.map((interval) => (
              <DropdownItem key={interval.value}>
                {interval.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      )}

      {/* Manual refresh button */}
      <Button
        size="sm"
        color={autoRefresh ? "success" : "primary"}
        variant="flat"
        onClick={handleRefresh}
        disabled={isLoading || isDisabled}
        startContent={getButtonIcon()}
      >
        {getButtonText()}
      </Button>
    </div>
  );
};

// Wrapped component with error boundary
const RefreshButtonWithErrorBoundary = (props) => (
  <RefreshErrorBoundary>
    <RefreshButton {...props} />
  </RefreshErrorBoundary>
);

export default RefreshButtonWithErrorBoundary; 