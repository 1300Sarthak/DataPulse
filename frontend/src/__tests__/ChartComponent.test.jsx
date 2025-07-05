/* global describe, it, expect, beforeEach, afterEach, jest, global */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChartComponent from "../components/ChartComponent";
import '@testing-library/jest-dom';

// Mock recharts to avoid SVG rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children, data }) => (
    <div data-testid="line-chart" data-points={data?.length || 0}>
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe("ChartComponent", () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders with default props (BTC, 1h)", async () => {
    render(<ChartComponent />);
    
    expect(screen.getByText("BTC Price History")).toBeInTheDocument();
    expect(screen.getByText("Last hour")).toBeInTheDocument();
    expect(screen.getByText("1H")).toBeInTheDocument();
    expect(screen.getByText("24H")).toBeInTheDocument();
    expect(screen.getByText("7D")).toBeInTheDocument();
    
    // Should show loading initially
    expect(screen.getByText("Loading chart...")).toBeInTheDocument();
    
    // Wait for mock data to load
    await waitFor(() => {
      expect(screen.queryByText("Loading chart...")).not.toBeInTheDocument();
    });
    
    // Should render chart components
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with custom symbol and period", async () => {
    render(<ChartComponent symbol="ETH" initialPeriod="24h" />);
    
    expect(screen.getByText("ETH Price History")).toBeInTheDocument();
    expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText("Loading chart...")).not.toBeInTheDocument();
    });
  });

  it("changes period when buttons are clicked", async () => {
    render(<ChartComponent />);
    
    await waitFor(() => {
      expect(screen.queryByText("Loading chart...")).not.toBeInTheDocument();
    });
    
    // Click 24H button
    fireEvent.click(screen.getByText("24H"));
    expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
    
    // Click 7D button
    fireEvent.click(screen.getByText("7D"));
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
  });

  it("shows error state when API fails", async () => {
    fetch.mockRejectedValueOnce(new Error("API Error"));
    
    render(<ChartComponent />);
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load chart data")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("retries data fetch when retry button is clicked", async () => {
    fetch.mockRejectedValueOnce(new Error("API Error"));
    
    render(<ChartComponent />);
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load chart data")).toBeInTheDocument();
    });
    
    // Click retry
    fireEvent.click(screen.getByText("Retry"));
    
    await waitFor(() => {
      expect(screen.queryByText("Failed to load chart data")).not.toBeInTheDocument();
    });
  });

  it("generates correct number of data points for different periods", async () => {
    render(<ChartComponent initialPeriod="1h" />);
    
    await waitFor(() => {
      const chart = screen.getByTestId("line-chart");
      expect(chart.getAttribute("data-points")).toBe("60"); // 1h = 60 points
    });
    
    // Change to 24h
    fireEvent.click(screen.getByText("24H"));
    
    await waitFor(() => {
      const chart = screen.getByTestId("line-chart");
      expect(chart.getAttribute("data-points")).toBe("24"); // 24h = 24 points
    });
    
    // Change to 7d
    fireEvent.click(screen.getByText("7D"));
    
    await waitFor(() => {
      const chart = screen.getByTestId("line-chart");
      expect(chart.getAttribute("data-points")).toBe("7"); // 7d = 7 points
    });
  });

  it("re-renders when symbol prop changes", async () => {
    const { rerender } = render(<ChartComponent symbol="BTC" />);
    
    await waitFor(() => {
      expect(screen.getByText("BTC Price History")).toBeInTheDocument();
    });
    
    // Change symbol
    rerender(<ChartComponent symbol="ETH" />);
    
    await waitFor(() => {
      expect(screen.getByText("ETH Price History")).toBeInTheDocument();
      expect(screen.queryByText("BTC Price History")).not.toBeInTheDocument();
    });
  });

  it("maintains selected period when symbol changes", async () => {
    const { rerender } = render(<ChartComponent symbol="BTC" initialPeriod="24h" />);
    
    await waitFor(() => {
      expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
    });
    
    // Change symbol
    rerender(<ChartComponent symbol="ETH" initialPeriod="24h" />);
    
    await waitFor(() => {
      expect(screen.getByText("ETH Price History")).toBeInTheDocument();
      expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
    });
  });
});

// Snapshot test
describe("ChartComponent Snapshot", () => {
  it("matches snapshot when loaded", async () => {
    const { container } = render(<ChartComponent />);
    
    await waitFor(() => {
      expect(screen.queryByText("Loading chart...")).not.toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot in error state", async () => {
    fetch.mockRejectedValueOnce(new Error("API Error"));
    
    const { container } = render(<ChartComponent />);
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load chart data")).toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });
}); 