// Mock environment variables
import.meta.env = {
  VITE_API_BASE_URL: 'http://localhost:8000'
};

import { apiService } from '../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Health Check', () => {
    it('should call health endpoint correctly', async () => {
      const mockResponse = { status: 'healthy', timestamp: '2024-01-01T00:00:00Z' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.getHealth();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/health/',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Crypto API', () => {
    it('should call crypto endpoint correctly', async () => {
      const mockResponse = { BTC: 50000, ETH: 3000 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.getCryptoPrices();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/crypto/',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Stocks API', () => {
    it('should call stocks endpoint correctly', async () => {
      const mockResponse = { symbol: 'AAPL', price: 150.50 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.getStockPrice('AAPL');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/stocks/?symbol=AAPL',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Weather API', () => {
    it('should call weather endpoint correctly', async () => {
      const mockResponse = { city: 'New York', temp: 20, desc: 'Sunny' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.getWeather('New York');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/weather/?city=New%20York',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('News API', () => {
    it('should call news endpoint correctly', async () => {
      const mockResponse = [
        { title: 'Test News', source: 'Test Source', url: 'http://test.com', publishedAt: '2024-01-01T00:00:00Z' }
      ];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.getNews();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/news/',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Exchange Rates API', () => {
    it('should call exchange rates endpoint correctly', async () => {
      const mockResponse = { USD_EUR: 0.85, USD_INR: 75.0 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.getExchangeRates();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/exchange-rate/',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Refresh API', () => {
    it('should call refresh endpoint correctly', async () => {
      const mockResponse = { message: 'Data refresh completed', results: {} };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.refresh();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getHealth()).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiService.getHealth()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle timeouts', async () => {
      fetch.mockImplementationOnce(() => new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 11000);
      }));

      await expect(apiService.getHealth()).rejects.toThrow('Request timeout');
    });
  });
}); 