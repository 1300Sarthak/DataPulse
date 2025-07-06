import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BentoTile from '../components/BentoTile';

describe('BentoTile', () => {
  const defaultProps = {
    title: 'Bitcoin',
    symbol: 'BTC',
    price: 50000,
    change: 2.5,
    type: 'crypto',
    size: 'md',
  };

  it('renders with default props', () => {
    render(<BentoTile {...defaultProps} />);
    
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('+2.50%')).toBeInTheDocument();
    expect(screen.getByText('Crypto')).toBeInTheDocument();
  });

  it('renders stock type correctly', () => {
    render(<BentoTile {...defaultProps} type="stock" title="Apple Inc." symbol="AAPL" />);
    
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
  });

  it('shows positive change with green color and up arrow', () => {
    render(<BentoTile {...defaultProps} change={5.2} />);
    
    const changeElement = screen.getByText('+5.20%');
    expect(changeElement).toHaveClass('text-green-600');
    
    // Check for up arrow icon
    const upArrow = document.querySelector('svg[stroke="currentColor"]');
    expect(upArrow).toBeInTheDocument();
  });

  it('shows negative change with red color and down arrow', () => {
    render(<BentoTile {...defaultProps} change={-3.1} />);
    
    const changeElement = screen.getByText('-3.10%');
    expect(changeElement).toHaveClass('text-red-600');
    
    // Check for down arrow icon
    const downArrow = document.querySelector('svg[stroke="currentColor"]');
    expect(downArrow).toBeInTheDocument();
  });

  it('shows zero change without arrow', () => {
    render(<BentoTile {...defaultProps} change={0} />);
    
    const changeElement = screen.getByText('0.00%');
    expect(changeElement).toHaveClass('text-gray-600');
    
    // Should not have arrow icons
    const arrows = document.querySelectorAll('svg[stroke="currentColor"]');
    expect(arrows).toHaveLength(0);
  });

  it('applies correct grid classes for different sizes', () => {
    const { rerender } = render(<BentoTile {...defaultProps} size="lg" />);
    let card = document.querySelector('.col-span-2.row-span-2');
    expect(card).toBeInTheDocument();

    rerender(<BentoTile {...defaultProps} size="md" />);
    card = document.querySelector('.col-span-1.row-span-2');
    expect(card).toBeInTheDocument();

    rerender(<BentoTile {...defaultProps} size="sm" />);
    card = document.querySelector('.col-span-1.row-span-1');
    expect(card).toBeInTheDocument();
  });

  it('shows additional info for large tiles', () => {
    render(<BentoTile {...defaultProps} size="lg" />);
    
    expect(screen.getByText('Market Cap: $1.2T')).toBeInTheDocument();
    expect(screen.getByText('Volume: 24.5M')).toBeInTheDocument();
  });

  it('does not show additional info for smaller tiles', () => {
    render(<BentoTile {...defaultProps} size="md" />);
    
    expect(screen.queryByText('Market Cap: $1.2T')).not.toBeInTheDocument();
    expect(screen.queryByText('Volume: 24.5M')).not.toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    render(<BentoTile {...defaultProps} loading={true} />);
    
    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Should not show actual content
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
    expect(screen.queryByText('$50,000.00')).not.toBeInTheDocument();
  });

  it('formats price correctly for different values', () => {
    const { rerender } = render(<BentoTile {...defaultProps} price={1234.56} />);
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();

    rerender(<BentoTile {...defaultProps} price={0.00123} />);
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Rounds to 2 decimals

    rerender(<BentoTile {...defaultProps} price="N/A" />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('formats change percentage correctly', () => {
    const { rerender } = render(<BentoTile {...defaultProps} change={1.234} />);
    expect(screen.getByText('+1.23%')).toBeInTheDocument();

    rerender(<BentoTile {...defaultProps} change={-5.678} />);
    expect(screen.getByText('-5.68%')).toBeInTheDocument();

    rerender(<BentoTile {...defaultProps} change="N/A" />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('applies hover effects and transitions', () => {
    render(<BentoTile {...defaultProps} />);
    
    const card = document.querySelector('.hover\\:scale-\\[1\\.02\\]');
    expect(card).toBeInTheDocument();
    
    const transitionElement = document.querySelector('.transition-transform');
    expect(transitionElement).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<BentoTile {...defaultProps} />);
    
    const card = document.querySelector('.rounded-2xl');
    expect(card).toBeInTheDocument();
    
    const shadowElement = document.querySelector('.shadow-md');
    expect(shadowElement).toBeInTheDocument();
  });
}); 