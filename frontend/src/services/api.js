import { useErrorToast } from '../context/ErrorToastContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    async getCryptoPrices() {
      const response = await fetchWithTimeout(`${API_BASE_URL}/crypto/`, {}, 10000, errorToast);
      return response.json();
    },
    async getWeather(city) {
      const response = await fetchWithTimeout(`${API_BASE_URL}/weather/?city=${encodeURIComponent(city)}`, {}, 10000, errorToast);
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