/* global describe, it, expect, beforeEach, afterEach, jest, global */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewsFeed from "../components/NewsFeed";
import '@testing-library/jest-dom';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockOpen,
});

describe("NewsFeed", () => {
  beforeEach(() => {
    fetch.mockClear();
    mockOpen.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders loading state initially", () => {
    render(<NewsFeed />);
    
    expect(screen.getByText("Latest News")).toBeInTheDocument();
    expect(screen.getByText("Top headlines from around the world")).toBeInTheDocument();
    
    // Should show loading skeletons
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders 5 news items after loading", async () => {
    render(<NewsFeed />);
    
    // Wait for mock data to load
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
    
    // Should render 5 news items
    expect(screen.getByText("Bitcoin Surges Past $50,000 as Institutional Adoption Grows")).toBeInTheDocument();
    expect(screen.getByText("Tech Stocks Rally on Strong Earnings Reports")).toBeInTheDocument();
    expect(screen.getByText("Federal Reserve Announces New Digital Currency Plans")).toBeInTheDocument();
    expect(screen.getByText("Major Bank Launches Cryptocurrency Trading Platform")).toBeInTheDocument();
    expect(screen.getByText("Global Markets React to Economic Policy Changes")).toBeInTheDocument();
    
    // Should show sources
    expect(screen.getByText("Reuters")).toBeInTheDocument();
    expect(screen.getByText("Bloomberg")).toBeInTheDocument();
    expect(screen.getByText("CNBC")).toBeInTheDocument();
    expect(screen.getByText("TechCrunch")).toBeInTheDocument();
    expect(screen.getByText("BBC")).toBeInTheDocument();
  });

  it("opens URL in new tab when news item is clicked", async () => {
    render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
    
    // Click on first news item
    const firstNewsItem = screen.getByText("Bitcoin Surges Past $50,000 as Institutional Adoption Grows");
    fireEvent.click(firstNewsItem);
    
    expect(mockOpen).toHaveBeenCalledWith(
      "https://example.com/news/1",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("opens URL when 'Read more' link is clicked", async () => {
    render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
    
    // Click on "Read more" link
    const readMoreLinks = screen.getAllByText("Read more →");
    fireEvent.click(readMoreLinks[0]);
    
    expect(mockOpen).toHaveBeenCalledWith(
      "https://example.com/news/1",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("shows error state when API fails", async () => {
    // Mock fetch to fail
    fetch.mockRejectedValueOnce(new Error("Network error"));
    
    render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load news")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("retries data fetch when retry button is clicked", async () => {
    // Mock fetch to fail first, then succeed
    fetch.mockRejectedValueOnce(new Error("Network error"));
    
    render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load news")).toBeInTheDocument();
    });
    
    // Click retry
    fireEvent.click(screen.getByText("Retry"));
    
    await waitFor(() => {
      expect(screen.queryByText("Failed to load news")).not.toBeInTheDocument();
      expect(screen.getByText("Bitcoin Surges Past $50,000 as Institutional Adoption Grows")).toBeInTheDocument();
    });
  });

  it("formats time correctly", async () => {
    render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
    
    // Should show time formatting (could be "Just now", "Xh ago", or "Xd ago")
    const timeElements = screen.getAllByText(/ago|now/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("displays correct number of news items", async () => {
    render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
    
    // Should have exactly 5 news items
    const newsItems = screen.getAllByText(/Read more →/);
    expect(newsItems).toHaveLength(5);
  });

  it("shows error boundary when component throws error", async () => {
    // Create a component that throws an error
    const ErrorThrowingComponent = () => {
      throw new Error("Test error");
    };
    
    // Mock the NewsFeed component to throw an error
    jest.doMock("../components/NewsFeed", () => ({
      __esModule: true,
      default: ErrorThrowingComponent,
    }));
    
    // Re-import to get the mocked version
    const { default: MockedNewsFeed } = await import("../components/NewsFeed");
    
    render(<MockedNewsFeed />);
    
    expect(screen.getByText("Something went wrong loading news")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("handles empty news array gracefully", async () => {
    // Mock fetch to return empty array
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    
    render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
    
    // Should not show any news items
    expect(screen.queryByText(/Read more →/)).not.toBeInTheDocument();
  });
});

// Snapshot tests
describe("NewsFeed Snapshot", () => {
  it("matches snapshot when loaded", async () => {
    const { container } = render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot in loading state", () => {
    const { container } = render(<NewsFeed />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot in error state", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));
    
    const { container } = render(<NewsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load news")).toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });
}); 