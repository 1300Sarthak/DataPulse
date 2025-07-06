import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BentoCard from '../components/BentoCard';

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Card: ({ children, className, onClick, onMouseEnter, onMouseLeave }) => (
    <div 
      className={className} 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid="card"
    >
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
  )
}));

describe('BentoCard', () => {
  const defaultCryptoProps = {
    type: "crypto",
    title: "Bitcoin",
    symbol: "BTC",
    price: 43250.67,
    change: 2.34,
    size: "md"
  };

  const defaultStockProps = {
    type: "stock",
    title: "Apple Inc.",
    symbol: "AAPL",
    price: 175.43,
    change: -1.23,
    size: "md"
  };

  const defaultNewsProps = {
    type: "news",
    title: "Bitcoin Surges Past $43,000",
    symbol: "BTC",
    image: "https://example.com/image.jpg",
    url: "https://example.com/article",
    size: "md"
  };

  describe('Crypto/Stock Cards', () => {
    it('renders crypto card with correct data', () => {
      render(<BentoCard {...defaultCryptoProps} />);
      
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('$43,250.67')).toBeInTheDocument();
      expect(screen.getByText('+2.34%')).toBeInTheDocument();
      expect(screen.getByText('Crypto')).toBeInTheDocument();
    });

    it('renders stock card with correct data', () => {
      render(<BentoCard {...defaultStockProps} />);
      
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('$175.43')).toBeInTheDocument();
      expect(screen.getByText('-1.23%')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const { rerender } = render(<BentoCard {...defaultCryptoProps} size="sm" />);
      expect(screen.getByTestId('card')).toHaveClass('w-48 h-40');

      rerender(<BentoCard {...defaultCryptoProps} size="lg" />);
      expect(screen.getByTestId('card')).toHaveClass('w-80 h-64');
    });

    it('shows positive change in green', () => {
      render(<BentoCard {...defaultCryptoProps} change={5.67} />);
      const changeElement = screen.getByText('+5.67%');
      expect(changeElement).toHaveClass('text-green-600');
    });

    it('shows negative change in red', () => {
      render(<BentoCard {...defaultCryptoProps} change={-3.21} />);
      const changeElement = screen.getByText('-3.21%');
      expect(changeElement).toHaveClass('text-red-600');
    });

    it('calls onClick when clicked', () => {
      const mockOnClick = jest.fn();
      render(<BentoCard {...defaultCryptoProps} onClick={mockOnClick} />);
      
      fireEvent.click(screen.getByTestId('card'));
      expect(mockOnClick).toHaveBeenCalledWith({
        type: "crypto",
        symbol: "BTC",
        title: "Bitcoin"
      });
    });

    it('shows loading skeleton when loading', () => {
      render(<BentoCard {...defaultCryptoProps} loading={true} />);
      
      expect(screen.getByTestId('card')).toHaveClass('animate-pulse');
      expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
    });

    it('shows additional info for large cards', () => {
      render(<BentoCard {...defaultCryptoProps} size="lg" />);
      
      expect(screen.getByText('Market Cap: $1.2T')).toBeInTheDocument();
      expect(screen.getByText('Volume: 24.5M')).toBeInTheDocument();
    });
  });

  describe('News Cards', () => {
    it('renders news card with image and title', () => {
      render(<BentoCard {...defaultNewsProps} />);
      
      expect(screen.getByText('Bitcoin Surges Past $43,000')).toBeInTheDocument();
      expect(screen.getByAltText('Bitcoin Surges Past $43,000')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    it('opens URL in new tab when clicked', () => {
      const originalOpen = window.open;
      window.open = jest.fn();
      
      render(<BentoCard {...defaultNewsProps} />);
      fireEvent.click(screen.getByTestId('card'));
      
      expect(window.open).toHaveBeenCalledWith(
        'https://example.com/article',
        '_blank',
        'noopener,noreferrer'
      );
      
      window.open = originalOpen;
    });

    it('shows fallback image on error', () => {
      render(<BentoCard {...defaultNewsProps} />);
      
      const img = screen.getByAltText('Bitcoin Surges Past $43,000');
      fireEvent.error(img);
      
      expect(img.src).toContain('placeholder.com');
    });

    it('renders without image if not provided', () => {
      const propsWithoutImage = { ...defaultNewsProps };
      delete propsWithoutImage.image;
      
      render(<BentoCard {...propsWithoutImage} />);
      expect(screen.queryByAltText('Bitcoin Surges Past $43,000')).not.toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('applies hover effects', () => {
      render(<BentoCard {...defaultCryptoProps} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:scale-105');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-300');
    });

    it('changes shadow on hover', () => {
      render(<BentoCard {...defaultCryptoProps} />);
      
      const card = screen.getByTestId('card');
      fireEvent.mouseEnter(card);
      expect(card).toHaveClass('shadow-xl');
      
      fireEvent.mouseLeave(card);
      expect(card).not.toHaveClass('shadow-xl');
    });
  });

  describe('Price Formatting', () => {
    it('formats numeric prices correctly', () => {
      render(<BentoCard {...defaultCryptoProps} price={1234.56} />);
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('handles string prices', () => {
      render(<BentoCard {...defaultCryptoProps} price="N/A" />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('formats change percentages correctly', () => {
      render(<BentoCard {...defaultCryptoProps} change={0} />);
      expect(screen.getByText('+0.00%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has cursor pointer for clickable cards', () => {
      render(<BentoCard {...defaultCryptoProps} onClick={() => {}} />);
      expect(screen.getByTestId('card')).toHaveClass('cursor-pointer');
    });

    it('renders with proper semantic structure', () => {
      render(<BentoCard {...defaultCryptoProps} />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-body')).toBeInTheDocument();
    });
  });
}); 