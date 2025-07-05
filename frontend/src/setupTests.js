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