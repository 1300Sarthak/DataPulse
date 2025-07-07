import { useErrorToast } from '../context/ErrorToastContext';

// Use Vercel proxy for API calls - no environment variable needed
const API_BASE_URL = '/api';

// Helper function to create fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000, errorToast) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (errorToast) errorToast(`HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      if (errorToast) errorToast('Request timeout');
      throw new Error('Request timeout');
    }
    if (errorToast) errorToast(error.message);
    throw error;
  }
};

export const useApiService = () => {
  const errorToast = useErrorToast();
  return {
    async getHealth() {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health/`, {}, 10000, errorToast);
      return response.json();
    },
    async getStockPrice(symbol) {
      const response = await fetchWithTimeout(`${API_BASE_URL}/stocks/?symbol=${symbol}`, {}, 10000, errorToast);
      return response.json();
    },
    async getStockHistoricalData(symbol, period = "1D") {
      const response = await fetchWithTimeout(`${API_BASE_URL}/stocks/historical/${symbol}?period=${period}`, {}, 10000, errorToast);
      return response.json();
    },
    async getCryptoPrices(topN = 50) {
      const response = await fetchWithTimeout(`${API_BASE_URL}/crypto/?top_n=${topN}`, {}, 10000, errorToast);
      return response.json();
    },
    async getCryptoHistoricalData(symbol, days = "1") {
      const response = await fetchWithTimeout(`${API_BASE_URL}/crypto/historical/${symbol}?days=${days}`, {}, 10000, errorToast);
      return response.json();
    },
    async getWeather(city, unit = 'C') {
      const response = await fetchWithTimeout(`${API_BASE_URL}/weather/?city=${encodeURIComponent(city)}&unit=${unit}`, {}, 10000, errorToast);
      return response.json();
    },
    async getNews() {
      const response = await fetchWithTimeout(`${API_BASE_URL}/news/`, {}, 10000, errorToast);
      return response.json();
    },
    async getExchangeRates() {
      const response = await fetchWithTimeout(`${API_BASE_URL}/exchange-rate/`, {}, 10000, errorToast);
      return response.json();
    },
    async refresh() {
      const response = await fetchWithTimeout(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, 10000, errorToast);
      return response;
    }
  };
};

// Default export for non-hook usage (no error toast)
const apiService = {
  async getHealth() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health/`);
    return response.json();
  },
  async getStockPrice(symbol) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stocks/?symbol=${symbol}`);
    return response.json();
  },
  async getStockHistoricalData(symbol, period = "1D") {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stocks/historical/${symbol}?period=${period}`);
    return response.json();
  },
  async getCryptoPrices(topN = 50) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/crypto/?top_n=${topN}`);
    return response.json();
  },
  async getCryptoHistoricalData(symbol, days = "1") {
    const response = await fetchWithTimeout(`${API_BASE_URL}/crypto/historical/${symbol}?days=${days}`);
    return response.json();
  },
  async getWeather(city, unit = 'C') {
    const response = await fetchWithTimeout(`${API_BASE_URL}/weather/?city=${encodeURIComponent(city)}&unit=${unit}`);
    return response.json();
  },
  async getNews() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/news/`);
    return response.json();
  },
  async getExchangeRates() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/exchange-rate/`);
    return response.json();
  },
  async refresh() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  }
};

export default apiService; 