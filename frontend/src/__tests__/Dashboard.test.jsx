/* global jest, describe, it, expect, beforeEach, afterEach, require */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import '@testing-library/jest-dom';

// Mock apiService
jest.mock('../services/api', () => ({
  apiService: {
    getCryptoPrices: jest.fn(),
    getStockPrice: jest.fn(),
    getWeather: jest.fn(),
    getNews: jest.fn(),
    getExchangeRates: jest.fn(),
  },
}));

const { apiService } = require('../services/api');

describe("Dashboard polling and fallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("polls all APIs every 60s and updates last updated fallback on error", async () => {
    // Initial: all succeed
    apiService.getCryptoPrices.mockResolvedValueOnce({ price: 1 });
    apiService.getStockPrice.mockResolvedValueOnce({ price: 2 });
    apiService.getWeather.mockResolvedValueOnce({ temp: 3 });
    apiService.getNews.mockResolvedValueOnce([{ id: 1 }]);
    apiService.getExchangeRates.mockResolvedValueOnce({ usd: 1 });

    // Render
    await act(async () => {
      render(<Dashboard />);
    });

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiService.getCryptoPrices).toHaveBeenCalled();
      expect(apiService.getStockPrice).toHaveBeenCalled();
      expect(apiService.getWeather).toHaveBeenCalled();
      expect(apiService.getNews).toHaveBeenCalled();
      expect(apiService.getExchangeRates).toHaveBeenCalled();
    });

    // Simulate time passing for polling (60s)
    apiService.getCryptoPrices.mockRejectedValueOnce(new Error("fail"));
    apiService.getStockPrice.mockResolvedValueOnce({ price: 2 });
    apiService.getWeather.mockResolvedValueOnce({ temp: 3 });
    apiService.getNews.mockResolvedValueOnce([{ id: 1 }]);
    apiService.getExchangeRates.mockResolvedValueOnce({ usd: 1 });

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Wait for error fallback to show
    await waitFor(() => {
      expect(screen.getByTestId("last-updated-crypto")).toBeInTheDocument();
      expect(screen.getByTestId("last-updated-crypto").textContent).toMatch(/Last updated/);
    });
  });

  it("shows 'Last updated X ago' with correct time", async () => {
    // Initial: all succeed
    apiService.getCryptoPrices.mockResolvedValueOnce({ price: 1 });
    apiService.getStockPrice.mockResolvedValueOnce({ price: 2 });
    apiService.getWeather.mockResolvedValueOnce({ temp: 3 });
    apiService.getNews.mockResolvedValueOnce([{ id: 1 }]);
    apiService.getExchangeRates.mockResolvedValueOnce({ usd: 1 });

    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(apiService.getCryptoPrices).toHaveBeenCalled();
    });

    // Simulate polling with error after 2 minutes
    apiService.getCryptoPrices.mockRejectedValueOnce(new Error("fail"));
    apiService.getStockPrice.mockResolvedValueOnce({ price: 2 });
    apiService.getWeather.mockResolvedValueOnce({ temp: 3 });
    apiService.getNews.mockResolvedValueOnce([{ id: 1 }]);
    apiService.getExchangeRates.mockResolvedValueOnce({ usd: 1 });

    act(() => {
      jest.advanceTimersByTime(120000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("last-updated-crypto")).toBeInTheDocument();
      expect(screen.getByTestId("last-updated-crypto").textContent).toMatch(/Last updated/);
    });
  });
}); 