import { useErrorToast } from '../context/ErrorToastContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datapulse-ztzi.onrender.com/api';
//const API_BASE_URL = 'http://localhost:8000/api';

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
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      if (errorToast) errorToast(`HTTP ${response.status}: ${response.statusText}`);
      throw error;
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
      const response = await fetchWithTimeout(`${API_BASE_URL}/stocks/price?symbol=${symbol}`, {}, 10000, errorToast);
      return response.json();
    },
    async getStockList(topN = 10) {
      const response = await fetchWithTimeout(`${API_BASE_URL}/stocks/list?top_n=${topN}`, {}, 10000, errorToast);
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

// Helper function for non-hook usage (no error toast)
const fetchWithTimeoutNoToast = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Default export for non-hook usage (no error toast)
const apiService = {
  async getHealth() {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/health/`);
    return response.json();
  },
  async getStockPrice(symbol) {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/stocks/price?symbol=${symbol}`);
    return response.json();
  },
  async getStockList(topN = 10) {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/stocks/list?top_n=${topN}`);
    return response.json();
  },
  async getStockHistoricalData(symbol, period = "1D") {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/stocks/historical/${symbol}?period=${period}`);
    return response.json();
  },
  async getCryptoPrices(topN = 50) {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/crypto/?top_n=${topN}`);
    return response.json();
  },
  async getCryptoHistoricalData(symbol, days = "1") {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/crypto/historical/${symbol}?days=${days}`);
    return response.json();
  },
  async getWeather(city, unit = 'C') {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/weather/?city=${encodeURIComponent(city)}&unit=${unit}`);
    return response.json();
  },
  async getNews() {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/news/`);
    return response.json();
  },
  async getExchangeRates() {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/exchange-rate/`);
    return response.json();
  },
  async refresh() {
    const response = await fetchWithTimeoutNoToast(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  }
};

export default apiService; 