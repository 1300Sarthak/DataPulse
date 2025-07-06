import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: typeof globalThis.jest !== 'undefined' ? globalThis.jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: globalThis.jest.fn(), // deprecated
    removeListener: globalThis.jest.fn(), // deprecated
    addEventListener: globalThis.jest.fn(),
    removeEventListener: globalThis.jest.fn(),
    dispatchEvent: globalThis.jest.fn(),
  })) : () => {},
});

// Mock IntersectionObserver
if (typeof globalThis !== 'undefined' && typeof globalThis.jest !== 'undefined') {
  globalThis.IntersectionObserver = globalThis.jest.fn().mockImplementation(() => ({
    observe: globalThis.jest.fn(),
    unobserve: globalThis.jest.fn(),
    disconnect: globalThis.jest.fn(),
  }));

  // Mock ResizeObserver
  globalThis.ResizeObserver = globalThis.jest.fn().mockImplementation(() => ({
    observe: globalThis.jest.fn(),
    unobserve: globalThis.jest.fn(),
    disconnect: globalThis.jest.fn(),
  }));
}

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
  configurable: true,
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: 'http://localhost:8000',
        VITE_OPENWEATHER_API_KEY: 'mock_openweather_api_key',
        VITE_FINNHUB_API_KEY: 'mock_finnhub_api_key',
      },
    },
  },
});