import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpandableModal from '../components/ExpandableModal';

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Modal: ({ children, isOpen, onClose, size, classNames }) => (
    isOpen ? (
      <div data-testid="modal" data-size={size} className={classNames?.base}>
        {children}
      </div>
    ) : null
  ),
  ModalContent: ({ children }) => (
    <div data-testid="modal-content">
      {children}
    </div>
  ),
  ModalHeader: ({ children, className }) => (
    <div className={className} data-testid="modal-header">
      {children}
    </div>
  ),
  ModalBody: ({ children, className }) => (
    <div className={className} data-testid="modal-body">
      {children}
    </div>
  ),
  ModalFooter: ({ children, className }) => (
    <div className={className} data-testid="modal-footer">
      {children}
    </div>
  ),
  Button: ({ children, size, variant, color, onClick, className }) => (
    <button 
      onClick={onClick} 
      className={className}
      data-testid="button"
      data-size={size}
      data-variant={variant}
      data-color={color}
    >
      {children}
    </button>
  ),
  Chip: ({ children, size, color, variant }) => (
    <span data-testid="chip" data-size={size} data-color={color} data-variant={variant}>
      {children}
    </span>
  ),
  Spinner: ({ size }) => (
    <div data-testid="spinner" data-size={size}>
      Loading...
    </div>
  )
}));

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, data }) => (
    <div data-testid="line-chart" data-points={data?.length || 0}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, strokeWidth }) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} data-width={strokeWidth} />
  ),
  XAxis: ({ dataKey, stroke }) => (
    <div data-testid="x-axis" data-key={dataKey} data-stroke={stroke} />
  ),
  YAxis: ({ stroke, tickFormatter }) => (
    <div data-testid="y-axis" data-stroke={stroke} data-formatter={!!tickFormatter} />
  ),
  CartesianGrid: ({ strokeDasharray, stroke }) => (
    <div data-testid="grid" data-dash={strokeDasharray} data-stroke={stroke} />
  ),
  Tooltip: ({ content }) => (
    <div data-testid="tooltip">
      {content && <div data-testid="custom-tooltip" />}
    </div>
  ),
  ResponsiveContainer: ({ children, width, height }) => (
    <div data-testid="responsive-container" style={{ width, height }}>
      {children}
    </div>
  )
}));

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.VITE_FINNHUB_API_KEY = 'test-finnhub-key';
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe('ExpandableModal', () => {
  const mockCryptoData = {
    type: "crypto",
    title: "Bitcoin",
    symbol: "bitcoin",
    price: 43250.67,
    change: 2.34
  };

  const mockStockData = {
    type: "stock",
    title: "Apple Inc.",
    symbol: "AAPL",
    price: 175.43,
    change: -1.23
  };

  const mockCryptoChartData = {
    prices: [
      [1640995200000, 45000],
      [1641081600000, 46000],
      [1641168000000, 44000]
    ]
  };

  const mockStockChartData = {
    s: "ok",
    t: [1640995200, 1641081600, 1641168000],
    c: [150, 155, 145]
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Modal Visibility', () => {
    it('renders when isOpen is true', () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <ExpandableModal 
          isOpen={false} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Header Display', () => {
    it('displays crypto header correctly', () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );
      
      expect(screen.getByText('Bitcoin (bitcoin)')).toBeInTheDocument();
      expect(screen.getByText('Cryptocurrency Price Chart')).toBeInTheDocument();
      expect(screen.getByText('Crypto')).toBeInTheDocument();
    });

    it('displays stock header correctly', () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockStockData}
        />
      );
      
      expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
      expect(screen.getByText('Stock Price Chart')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
    });
  });

  describe('Time Range Toggles', () => {
    it('renders all time range buttons', () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );
      
      expect(screen.getByText('1H')).toBeInTheDocument();
      expect(screen.getByText('24H')).toBeInTheDocument();
      expect(screen.getByText('7D')).toBeInTheDocument();
      expect(screen.getByText('1Y')).toBeInTheDocument();
    });

    it('highlights active time range', () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );
      
      const activeButton = screen.getByText('24H').closest('button');
      expect(activeButton).toHaveAttribute('data-variant', 'solid');
    });

    it('changes time range when clicked', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockCryptoChartData
      });

      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      const oneHourButton = screen.getByText('1H').closest('button');
      fireEvent.click(oneHourButton);

      await waitFor(() => {
        expect(oneHourButton).toHaveAttribute('data-variant', 'solid');
      });
    });
  });

  describe('Crypto Chart Data', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockCryptoChartData
      });
    });

    it('fetches and displays crypto chart data', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toHaveAttribute('data-points', '3');
      });
    });

    it('calls correct CoinGecko API endpoint', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('api.coingecko.com/api/v3/coins/bitcoin/market_chart')
        );
      });
    });
  });

  describe('Stock Chart Data', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockStockChartData
      });
    });

    it('fetches and displays stock chart data', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockStockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('calls correct Finnhub API endpoint', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockStockData}
        />
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('finnhub.io/api/v1/stock/candle')
        );
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when loading prop is true', () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
          loading={true}
        />
      );
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('shows loading spinner when fetching chart data', async () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      expect(screen.getByText('Loading chart...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API error', async () => {
      fetch.mockRejectedValue(new Error('API Error'));

      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('handles no data available for stocks', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ s: "no_data" })
      });

      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockStockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
      });
    });

    it('provides retry functionality', async () => {
      fetch
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCryptoChartData
        });

      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Additional Info Display', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockCryptoChartData
      });
    });

    it('displays current price', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$43,250.67')).toBeInTheDocument();
      });
    });

    it('displays 24h change', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('+2.34%')).toBeInTheDocument();
      });
    });

    it('displays market cap and volume', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$1.2T')).toBeInTheDocument();
        expect(screen.getByText('24.5M')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Footer', () => {
    it('renders close button', () => {
      const mockOnClose = jest.fn();
      
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={mockOnClose} 
          data={mockCryptoData}
        />
      );
      
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
      
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Chart Components', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockCryptoChartData
      });
    });

    it('renders all chart components', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('line')).toBeInTheDocument();
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        expect(screen.getByTestId('y-axis')).toBeInTheDocument();
        expect(screen.getByTestId('grid')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      });
    });

    it('configures line chart correctly', async () => {
      render(
        <ExpandableModal 
          isOpen={true} 
          onClose={() => {}} 
          data={mockCryptoData}
        />
      );

      await waitFor(() => {
        const line = screen.getByTestId('line');
        expect(line).toHaveAttribute('data-key', 'price');
        expect(line).toHaveAttribute('data-stroke', '#3B82F6');
        expect(line).toHaveAttribute('data-width', '2');
      });
    });
  });
}); 