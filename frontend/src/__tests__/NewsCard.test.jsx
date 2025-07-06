import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewsCard from '../components/NewsCard';

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockOpen,
});

describe('NewsCard', () => {
  const defaultProps = {
    title: 'Bitcoin Surges Past $50,000',
    source: 'Reuters',
    image: 'https://example.com/image.jpg',
    publishedAt: '2024-01-01T12:00:00Z',
    url: 'https://example.com/news/1',
  };

  beforeEach(() => {
    mockOpen.mockClear();
  });

  it('renders with all props', () => {
    render(<NewsCard {...defaultProps} />);
    
    expect(screen.getByText('Bitcoin Surges Past $50,000')).toBeInTheDocument();
    expect(screen.getByText('Reuters')).toBeInTheDocument();
    expect(screen.getByText('12h ago')).toBeInTheDocument();
  });

  it('displays image with correct src and alt', () => {
    render(<NewsCard {...defaultProps} />);
    
    const image = screen.getByAltText('Bitcoin Surges Past $50,000');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveClass('w-full', 'h-20', 'object-cover', 'rounded-lg');
  });

  it('shows placeholder image when no image provided', () => {
    render(<NewsCard {...defaultProps} image={null} />);
    
    const image = screen.getByAltText('Bitcoin Surges Past $50,000');
    expect(image).toHaveAttribute('src', 'https://via.placeholder.com/300x150?text=News');
  });

  it('shows placeholder image when image fails to load', () => {
    render(<NewsCard {...defaultProps} image="https://invalid-url.com/image.jpg" />);
    
    const image = screen.getByAltText('Bitcoin Surges Past $50,000');
    fireEvent.error(image);
    
    expect(image).toHaveAttribute('src', 'https://via.placeholder.com/300x150?text=News');
  });

  it('formats time correctly for different durations', () => {
    const now = new Date();
    
    // Just now
    const { rerender } = render(
      <NewsCard {...defaultProps} publishedAt={now.toISOString()} />
    );
    expect(screen.getByText('Just now')).toBeInTheDocument();

    // 2 hours ago
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    rerender(<NewsCard {...defaultProps} publishedAt={twoHoursAgo.toISOString()} />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();

    // 2 days ago
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    rerender(<NewsCard {...defaultProps} publishedAt={twoDaysAgo.toISOString()} />);
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });

  it('handles missing publishedAt gracefully', () => {
    render(<NewsCard {...defaultProps} publishedAt={null} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('opens URL in new tab when clicked', () => {
    render(<NewsCard {...defaultProps} />);
    
    const card = screen.getByText('Bitcoin Surges Past $50,000').closest('.cursor-pointer');
    fireEvent.click(card);
    
    expect(mockOpen).toHaveBeenCalledWith(
      'https://example.com/news/1',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('does not open URL when no URL provided', () => {
    render(<NewsCard {...defaultProps} url={null} />);
    
    const card = screen.getByText('Bitcoin Surges Past $50,000').closest('.cursor-pointer');
    fireEvent.click(card);
    
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it('shows loading skeleton when loading is true', () => {
    render(<NewsCard {...defaultProps} loading={true} />);
    
    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Should not show actual content
    expect(screen.queryByText('Bitcoin Surges Past $50,000')).not.toBeInTheDocument();
    expect(screen.queryByText('Reuters')).not.toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<NewsCard {...defaultProps} />);
    
    const card = document.querySelector('.rounded-2xl');
    expect(card).toBeInTheDocument();
    
    const shadowElement = document.querySelector('.shadow-md');
    expect(shadowElement).toBeInTheDocument();
    
    const hoverElement = document.querySelector('.hover\\:scale-\\[1\\.02\\]');
    expect(hoverElement).toBeInTheDocument();
  });

  it('truncates long titles with line-clamp', () => {
    const longTitle = 'This is a very long news title that should be truncated to two lines maximum to maintain the card layout and prevent overflow issues';
    render(<NewsCard {...defaultProps} title={longTitle} />);
    
    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass('line-clamp-2');
  });

  it('displays source badge correctly', () => {
    render(<NewsCard {...defaultProps} />);
    
    const sourceBadge = screen.getByText('Reuters');
    expect(sourceBadge).toHaveClass('bg-black', 'bg-opacity-50', 'text-white');
  });

  it('has correct image styling', () => {
    render(<NewsCard {...defaultProps} />);
    
    const image = screen.getByAltText('Bitcoin Surges Past $50,000');
    expect(image).toHaveClass('w-full', 'h-20', 'object-cover', 'rounded-lg');
  });

  it('handles empty title gracefully', () => {
    render(<NewsCard {...defaultProps} title="" />);
    
    const image = screen.getByAltText('');
    expect(image).toBeInTheDocument();
  });

  it('handles missing source gracefully', () => {
    render(<NewsCard {...defaultProps} source={null} />);
    
    // Should still render without crashing
    expect(screen.getByText('Bitcoin Surges Past $50,000')).toBeInTheDocument();
  });
}); 