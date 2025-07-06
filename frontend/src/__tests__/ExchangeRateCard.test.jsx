import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExchangeRateCard from '../components/ExchangeRateCard';

describe('ExchangeRateCard', () => {
  const defaultProps = {
    rates: {
      USD_EUR: 0.8500,
      USD_INR: 75.5000,
    },
  };

  it('renders with exchange rates', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    expect(screen.getByText('Exchange Rates')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('INR')).toBeInTheDocument();
    expect(screen.getByText('0.8500')).toBeInTheDocument();
    expect(screen.getByText('75.5000')).toBeInTheDocument();
  });

  it('formats rates correctly to 4 decimal places', () => {
    const rates = {
      USD_EUR: 0.123456,
      USD_INR: 123.456789,
    };
    render(<ExchangeRateCard rates={rates} />);
    
    expect(screen.getByText('0.1235')).toBeInTheDocument(); // Rounded to 4 decimals
    expect(screen.getByText('123.4568')).toBeInTheDocument(); // Rounded to 4 decimals
  });

  it('handles string rates gracefully', () => {
    const rates = {
      USD_EUR: '0.8500',
      USD_INR: '75.5000',
    };
    render(<ExchangeRateCard rates={rates} />);
    
    expect(screen.getByText('0.8500')).toBeInTheDocument();
    expect(screen.getByText('75.5000')).toBeInTheDocument();
  });

  it('shows mock change indicators', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    expect(screen.getByText('+0.5%')).toBeInTheDocument();
    expect(screen.getByText('-0.2%')).toBeInTheDocument();
  });

  it('displays change icons correctly', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    // Check for up and down arrow icons
    const arrows = document.querySelectorAll('svg[stroke="currentColor"]');
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('shows mini chart section', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    expect(screen.getByText('24h Change')).toBeInTheDocument();
    expect(screen.getByText('+0.15%')).toBeInTheDocument();
  });

  it('renders mini chart bars', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    const chartBars = document.querySelectorAll('.bg-blue-200');
    expect(chartBars.length).toBe(7); // 7 bars in the mini chart
  });

  it('shows loading skeleton when loading is true', () => {
    render(<ExchangeRateCard {...defaultProps} loading={true} />);
    
    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Should not show actual content
    expect(screen.queryByText('Exchange Rates')).not.toBeInTheDocument();
    expect(screen.queryByText('0.8500')).not.toBeInTheDocument();
  });

  it('handles missing rates gracefully', () => {
    render(<ExchangeRateCard rates={null} />);
    
    // Should still render the header
    expect(screen.getByText('Exchange Rates')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('handles partial rates', () => {
    const partialRates = {
      USD_EUR: 0.8500,
      // USD_INR missing
    };
    render(<ExchangeRateCard rates={partialRates} />);
    
    expect(screen.getByText('0.8500')).toBeInTheDocument();
    expect(screen.queryByText('INR')).not.toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    const card = document.querySelector('.rounded-2xl');
    expect(card).toBeInTheDocument();
    
    const shadowElement = document.querySelector('.shadow-md');
    expect(shadowElement).toBeInTheDocument();
    
    const hoverElement = document.querySelector('.hover\\:scale-\\[1\\.02\\]');
    expect(hoverElement).toBeInTheDocument();
  });

  it('has correct grid positioning', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    const card = document.querySelector('.col-span-1.row-span-1');
    expect(card).toBeInTheDocument();
  });

  it('displays USD chip correctly', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    const usdChip = screen.getByText('USD');
    expect(usdChip).toBeInTheDocument();
  });

  it('shows correct change colors', () => {
    render(<ExchangeRateCard {...defaultProps} />);
    
    const positiveChange = screen.getByText('+0.5%');
    expect(positiveChange).toHaveClass('text-green-600');
    
    const negativeChange = screen.getByText('-0.2%');
    expect(negativeChange).toHaveClass('text-red-600');
  });

  it('handles empty rates object', () => {
    render(<ExchangeRateCard rates={{}} />);
    
    // Should still render the header
    expect(screen.getByText('Exchange Rates')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });
}); 