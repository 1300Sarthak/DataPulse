import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeatherCard from '../components/WeatherCard';

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Card: ({ children, className }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardBody: ({ children, className }) => (
    <div className={className} data-testid="card-body">
      {children}
    </div>
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

// Mock fetch
global.fetch = jest.fn();

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.VITE_OPENWEATHER_API_KEY = 'test-api-key';
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe('WeatherCard', () => {
  const mockWeatherData = {
    main: {
      temp: 22.5,
      humidity: 65
    },
    weather: [{
      description: 'scattered clouds',
      icon: '03d'
    }],
    wind: {
      speed: 3.2
    },
    name: 'San Francisco'
  };

  const mockGeocodeData = [{
    name: 'San Francisco',
    lat: 37.7749,
    lon: -122.4194
  }];

  beforeEach(() => {
    fetch.mockClear();
    mockGeolocation.getCurrentPosition.mockClear();
  });

  describe('Initial Loading State', () => {
    it('shows loading skeleton when loading prop is true', () => {
      render(<WeatherCard loading={true} />);
      
      expect(screen.getByTestId('card')).toHaveClass('animate-pulse');
      expect(screen.queryByText('Weather')).not.toBeInTheDocument();
    });

    it('shows loading spinner when initially loading', () => {
      render(<WeatherCard />);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading weather...')).toBeInTheDocument();
    });
  });

  describe('Geolocation', () => {
    it('requests user location when no city is provided', () => {
      render(<WeatherCard />);
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('handles geolocation success', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherData
        });

      render(<WeatherCard />);

      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });
    });

    it('handles geolocation error', () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      render(<WeatherCard />);

      expect(screen.getByText('Unable to retrieve your location')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('handles geolocation not supported', () => {
      delete global.navigator.geolocation;

      render(<WeatherCard />);

      expect(screen.getByText('Geolocation is not supported by this browser')).toBeInTheDocument();
    });
  });

  describe('City-based Weather', () => {
    it('fetches weather for provided city', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherData
        });

      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
        expect(screen.getByText('San Francisco')).toBeInTheDocument();
      });
    });

    it('handles city not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<WeatherCard city="InvalidCity" />);

      await waitFor(() => {
        expect(screen.getByText('City not found')).toBeInTheDocument();
      });
    });
  });

  describe('Weather Display', () => {
    beforeEach(() => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherData
        });
    });

    it('displays weather information correctly', async () => {
      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        expect(screen.getByText('Weather')).toBeInTheDocument();
        expect(screen.getByText('San Francisco')).toBeInTheDocument();
        expect(screen.getByText('22°C')).toBeInTheDocument();
        expect(screen.getByText('scattered clouds')).toBeInTheDocument();
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });

    it('shows weather icon', async () => {
      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        const weatherIcon = screen.getByAltText('scattered clouds');
        expect(weatherIcon.src).toContain('openweathermap.org');
        expect(weatherIcon.src).toContain('03d@2x.png');
      });
    });

    it('applies correct size classes', () => {
      const { rerender } = render(<WeatherCard city="San Francisco" size="sm" />);
      expect(screen.getByTestId('card')).toHaveClass('w-48 h-40');

      rerender(<WeatherCard city="San Francisco" size="lg" />);
      expect(screen.getByTestId('card')).toHaveClass('w-80 h-64');
    });

    it('shows additional info for large cards', async () => {
      render(<WeatherCard city="San Francisco" size="lg" />);

      await waitFor(() => {
        expect(screen.getByText('Humidity: 65%')).toBeInTheDocument();
        expect(screen.getByText('Wind: 3.2 m/s')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockRejectedValueOnce(new Error('API Error'));

      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch weather data')).toBeInTheDocument();
      });
    });

    it('handles geocoding error', async () => {
      fetch.mockRejectedValueOnce(new Error('Geocoding failed'));

      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to geocode city')).toBeInTheDocument();
      });
    });

    it('provides retry functionality', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherData
        });

      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch weather data')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('auto-refreshes every 30 minutes', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockWeatherData, main: { ...mockWeatherData.main, temp: 25 } })
        });

      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });

      // Fast-forward 30 minutes
      jest.advanceTimersByTime(30 * 60 * 1000);

      await waitFor(() => {
        expect(screen.getByText('25°C')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<WeatherCard />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-body')).toBeInTheDocument();
    });

    it('has cursor pointer for interactive elements', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodeData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherData
        });

      render(<WeatherCard city="San Francisco" />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('cursor-pointer');
      });
    });
  });
}); 