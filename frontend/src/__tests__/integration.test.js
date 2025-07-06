import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Dashboard from '../pages/Dashboard';
import apiService from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  getCryptoPrices: jest.fn(),
  getStockPrice: jest.fn(),
  getNews: jest.fn(),
}));

// Mock the error toast context
jest.mock('../context/ErrorToastContext', () => ({
  useErrorToast: () => ({
    showError: jest.fn()
  })
}));

describe('Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and display crypto data correctly', async () => {
    // Mock real API responses
    apiService.getCryptoPrices.mockResolvedValue({
      BTC: 50000.0,
      ETH: 3000.0
    });

    apiService.getStockPrice
      .mockResolvedValueOnce({ symbol: 'AAPL', price: 150.0 })
      .mockResolvedValueOnce({ symbol: 'TSLA', price: 200.0 })
      .mockResolvedValueOnce({ symbol: 'GOOGL', price: 100.0 })
      .mockResolvedValueOnce({ symbol: 'MSFT', price: 300.0 });

    apiService.getNews.mockResolvedValue([
      { title: 'Test News', symbol: 'TEST', image: 'test.jpg', url: 'test.com' }
    ]);

    await act(async () => {
      render(<Dashboard />);
    });

    // Wait for data to load
    await waitFor(() => {
      expect(apiService.getCryptoPrices).toHaveBeenCalled();
      expect(apiService.getStockPrice).toHaveBeenCalledWith('AAPL');
      expect(apiService.getStockPrice).toHaveBeenCalledWith('TSLA');
      expect(apiService.getStockPrice).toHaveBeenCalledWith('GOOGL');
      expect(apiService.getStockPrice).toHaveBeenCalledWith('MSFT');
    });

    // Verify the dashboard renders
    expect(screen.getByText('DataPulse Dashboard')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API failures
    apiService.getCryptoPrices.mockRejectedValue(new Error('API Error'));
    apiService.getStockPrice.mockRejectedValue(new Error('API Error'));
    apiService.getNews.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(<Dashboard />);
    });

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText('DataPulse Dashboard')).toBeInTheDocument();
    });

    // Should still render the dashboard even with errors
    expect(screen.getByText('Real-time financial data and market insights')).toBeInTheDocument();
  });
}); 