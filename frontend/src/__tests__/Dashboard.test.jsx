import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { SettingsProvider } from '../context/SettingsContext';

// Mock components
jest.mock('../components/BentoCard', () => {
  return function MockBentoCard({ type, title, symbol, price, change, image, url, size, loading, onClick }) {
    return (
      <div 
        data-testid="bento-card"
        data-type={type}
        data-title={title}
        data-symbol={symbol}
        data-price={price}
        data-change={change}
        data-size={size}
        data-loading={loading}
        onClick={() => onClick && onClick({ type, symbol, title })}
      >
        {type === 'news' ? (
          <div>
            <h3>{title}</h3>
            {image && <img src={image} alt={title} />}
            <span>{symbol}</span>
          </div>
        ) : (
          <div>
            <h3>{title}</h3>
            <span>{symbol}</span>
            <span>${price}</span>
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
    );
  };
});

jest.mock('../components/WeatherCard', () => {
  return function MockWeatherCard({ size }) {
    return (
      <div data-testid="weather-card" data-size={size}>
        <h3>Weather</h3>
        <span>22°C</span>
        <span>San Francisco</span>
      </div>
    );
  };
});

jest.mock('../components/ExpandableModal', () => {
  return function MockExpandableModal({ isOpen, onClose, data, loading }) {
    if (!isOpen) return null;
    return (
      <div data-testid="expandable-modal" data-loading={loading}>
        <h2>{data?.title} ({data?.symbol})</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Button: ({ children, color, variant, onClick, disabled, className }) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={className}
      data-testid="button"
      data-color={color}
      data-variant={variant}
    >
      {children}
    </button>
  ),
  Chip: ({ children, size, color, variant }) => (
    <span data-testid="chip" data-size={size} data-color={color} data-variant={variant}>
      {children}
    </span>
  )
}));

// Mock context
jest.mock('../context/ErrorToastContext', () => ({
  useErrorToast: () => ({
    showError: jest.fn()
  })
}));

// Mock API service
jest.mock('../services/api.js', () => ({
  __esModule: true,
  default: {
    getCryptoPrices: jest.fn(),
    getNews: jest.fn(),
    getStockPrice: jest.fn(),
  }
}));

import apiService from '../services/api.js';

describe('Dashboard', () => {
  const mockCryptoData = {
    BTC: 43250.67,
    ETH: 2650.89
  };

  const mockStockData = [
    { symbol: "AAPL", price: 175.43 },
    { symbol: "TSLA", price: 245.67 },
    { symbol: "GOOGL", price: 142.89 },
    { symbol: "MSFT", price: 378.12 }
  ];

  const mockNewsData = [
    {
      title: "Bitcoin Surges Past $43,000",
      symbol: "BTC",
      image: "https://example.com/image1.jpg",
      url: "https://example.com/article1"
    },
    {
      title: "Tesla Reports Strong Q4 Earnings",
      symbol: "TSLA",
      image: "https://example.com/image2.jpg",
      url: "https://example.com/article2"
    },
    {
      title: "Federal Reserve Signals Rate Cuts",
      symbol: "FED",
      image: "https://example.com/image3.jpg",
      url: "https://example.com/article3"
    },
    {
      title: "Ethereum Layer 2 Solutions Grow",
      symbol: "ETH",
      image: "https://example.com/image4.jpg",
      url: "https://example.com/article4"
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    apiService.getCryptoPrices.mockResolvedValue(mockCryptoData);
    apiService.getNews.mockResolvedValue(mockNewsData);
    // Mock individual stock calls
    apiService.getStockPrice
      .mockResolvedValueOnce(mockStockData[0])
      .mockResolvedValueOnce(mockStockData[1])
      .mockResolvedValueOnce(mockStockData[2])
      .mockResolvedValueOnce(mockStockData[3]);
  });

  describe('Initial Render', () => {
    it('renders dashboard header', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('DataPulse Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Real-time financial data and market insights')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('shows last updated time', () => {
      render(<Dashboard />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('fetches data on mount', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(apiService.getCryptoPrices).toHaveBeenCalled();
        expect(apiService.getNews).toHaveBeenCalled();
        expect(apiService.getStockPrice).toHaveBeenCalledWith('AAPL');
        expect(apiService.getStockPrice).toHaveBeenCalledWith('TSLA');
        expect(apiService.getStockPrice).toHaveBeenCalledWith('GOOGL');
        expect(apiService.getStockPrice).toHaveBeenCalledWith('MSFT');
      });
    });

    it('shows loading state initially', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('disables refresh button while loading', () => {
      render(<Dashboard />);
      
      const refreshButton = screen.getByText('Refreshing...').closest('button');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Card Rendering', () => {
    it('renders crypto cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const cryptoCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'crypto'
        );
        expect(cryptoCards).toHaveLength(2); // BTC and ETH
      });
    });

    it('renders stock cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const stockCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'stock'
        );
        expect(stockCards).toHaveLength(4); // AAPL, TSLA, GOOGL, MSFT
      });
    });

    it('renders news cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const newsCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'news'
        );
        expect(newsCards).toHaveLength(4);
      });
    });

    it('renders weather card', () => {
      render(<Dashboard />);
      
      expect(screen.getByTestId('weather-card')).toBeInTheDocument();
    });

    it('displays correct card data', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const bitcoinCard = screen.getByTestId('bento-card');
        expect(bitcoinCard).toHaveAttribute('data-title', 'Bitcoin');
        expect(bitcoinCard).toHaveAttribute('data-symbol', 'bitcoin');
        expect(bitcoinCard).toHaveAttribute('data-price', '43250.67');
        expect(bitcoinCard).toHaveAttribute('data-change', '2.34');
      });
    });
  });

  describe('Card Interactions', () => {
    it('opens modal when crypto card is clicked', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const cryptoCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'crypto'
        );
        fireEvent.click(cryptoCards[0]);
      });

      expect(screen.getByTestId('expandable-modal')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin (bitcoin)')).toBeInTheDocument();
    });

    it('opens modal when stock card is clicked', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const stockCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'stock'
        );
        fireEvent.click(stockCards[0]);
      });

      expect(screen.getByTestId('expandable-modal')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
    });

    it('does not open modal for news cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const newsCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'news'
        );
        fireEvent.click(newsCards[0]);
      });

      expect(screen.queryByTestId('expandable-modal')).not.toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const cryptoCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'crypto'
        );
        fireEvent.click(cryptoCards[0]);
      });

      expect(screen.getByTestId('expandable-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('expandable-modal')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes data when refresh button is clicked', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(apiService.getCryptoPrices).toHaveBeenCalledTimes(2); // 1 initial + 1 refresh
        expect(apiService.getNews).toHaveBeenCalledTimes(2);
        expect(apiService.getStockPrice).toHaveBeenCalledTimes(8); // 4 symbols × 2 calls
      });
    });

    it('shows loading state during refresh', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      // Mock a slow refresh
      apiService.getCryptoPrices.mockImplementation(() => new Promise(() => {}));
      apiService.getNews.mockImplementation(() => new Promise(() => {}));
      apiService.getStockPrice.mockImplementation(() => new Promise(() => {}));

      fireEvent.click(screen.getByText('Refresh'));
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('uses mock data when API fails', async () => {
      apiService.getCryptoPrices.mockRejectedValue(new Error('API Error'));
      apiService.getNews.mockRejectedValue(new Error('API Error'));
      apiService.getStockPrice.mockRejectedValue(new Error('API Error'));

      render(<Dashboard />);

      await waitFor(() => {
        // Should still render cards with mock data
        const cryptoCards = screen.getAllByTestId('bento-card').filter(
          card => card.getAttribute('data-type') === 'crypto'
        );
        expect(cryptoCards.length).toBeGreaterThan(0);
      });
    });

    it('handles partial API failures', async () => {
      apiService.getCryptoPrices.mockResolvedValueOnce({ success: false }); // Crypto fails
      apiService.getNews.mockResolvedValueOnce({ success: true, data: mockNewsData });
      apiService.getStockPrice.mockResolvedValueOnce({ success: true, data: mockStockData });

      render(<Dashboard />);

      await waitFor(() => {
        // Should still render some cards
        const allCards = screen.getAllByTestId('bento-card');
        expect(allCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Layout Structure', () => {
    it('renders fluid bento grid layout', () => {
      render(<Dashboard />);
      
      const container = screen.getByText('DataPulse Dashboard').closest('div');
      expect(container).toHaveClass('max-w-7xl');
    });

    it('applies responsive grid classes', () => {
      render(<Dashboard />);
      
      const gridContainer = screen.getByText('DataPulse Dashboard').closest('div').nextElementSibling;
      expect(gridContainer).toHaveClass('grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('md:grid-cols-2');
      expect(gridContainer).toHaveClass('lg:grid-cols-3');
    });

    it('has proper spacing between cards', () => {
      render(<Dashboard />);
      
      const gridContainer = screen.getByText('DataPulse Dashboard').closest('div').nextElementSibling;
      expect(gridContainer).toHaveClass('gap-6');
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('auto-refreshes every 60 seconds', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(apiService.getCryptoPrices).toHaveBeenCalledTimes(1); // Initial load
        expect(apiService.getNews).toHaveBeenCalledTimes(1);
        expect(apiService.getStockPrice).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 60 seconds
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(apiService.getCryptoPrices).toHaveBeenCalledTimes(2); // Initial + auto-refresh
        expect(apiService.getNews).toHaveBeenCalledTimes(2);
        expect(apiService.getStockPrice).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Last Updated Display', () => {
    it('formats last updated time correctly', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const lastUpdatedText = screen.getByText(/Last updated:/);
        expect(lastUpdatedText).toBeInTheDocument();
      });
    });

    it('shows "Never" when no data has been fetched', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Last updated: Never')).toBeInTheDocument();
    });
  });
}); 