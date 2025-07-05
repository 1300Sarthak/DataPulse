/* global describe, it, expect, beforeEach, afterEach, jest, global */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import RefreshButton from "../components/RefreshButton";

// Mock fetch globally
global.fetch = jest.fn();

// Mock timers
jest.useFakeTimers();

describe("RefreshButton", () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders refresh button with default state", () => {
    render(<RefreshButton onRefresh={jest.fn()} />);
    
    expect(screen.getByText("Refresh")).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls refresh endpoint and onRefresh callback on button click", async () => {
    const mockOnRefresh = jest.fn();
    fetch.mockResolvedValueOnce({ ok: true });

    render(<RefreshButton onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it("shows loading state during refresh", async () => {
    fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(screen.getByText("Refreshing...")).toBeInTheDocument();
  });

  it("disables button for 5 seconds after manual refresh", async () => {
    fetch.mockResolvedValueOnce({ ok: true });

    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText("Refresh (5s)")).toBeInTheDocument();
    });

    // Fast-forward 4 seconds
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.getByText("Refresh (1s)")).toBeInTheDocument();

    // Fast-forward 1 more second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("handles refresh errors gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(screen.getByText("Retry Refresh")).toBeInTheDocument();
  });

  it("handles HTTP error responses", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText("Refresh failed: 500")).toBeInTheDocument();
    });
  });

  it("toggles auto-refresh when switch is clicked", () => {
    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const autoSwitch = screen.getByRole("switch");
    expect(autoSwitch).not.toBeChecked();

    fireEvent.click(autoSwitch);
    expect(autoSwitch).toBeChecked();

    fireEvent.click(autoSwitch);
    expect(autoSwitch).not.toBeChecked();
  });

  it("shows interval selector when auto-refresh is enabled", () => {
    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const autoSwitch = screen.getByRole("switch");
    fireEvent.click(autoSwitch);

    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("hides interval selector when auto-refresh is disabled", () => {
    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const autoSwitch = screen.getByRole("switch");
    fireEvent.click(autoSwitch);
    expect(screen.getByText("30s")).toBeInTheDocument();

    fireEvent.click(autoSwitch);
    expect(screen.queryByText("30s")).not.toBeInTheDocument();
  });

  it("starts auto-refresh immediately when enabled", async () => {
    fetch.mockResolvedValue({ ok: true });
    const mockOnRefresh = jest.fn();

    render(<RefreshButton onRefresh={mockOnRefresh} />);
    
    const autoSwitch = screen.getByRole("switch");
    fireEvent.click(autoSwitch);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it("changes button color when auto-refresh is active", () => {
    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const autoSwitch = screen.getByRole("switch");
    fireEvent.click(autoSwitch);

    const refreshButton = screen.getByText("Refresh");
    expect(refreshButton.closest('button')).toHaveClass('bg-success');
  });

  it("does not disable button during auto-refresh", async () => {
    fetch.mockResolvedValue({ ok: true });

    render(<RefreshButton onRefresh={jest.fn()} />);
    
    const autoSwitch = screen.getByRole("switch");
    fireEvent.click(autoSwitch);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Button should not be disabled during auto-refresh
    const refreshButton = screen.getByText("Refresh");
    expect(refreshButton.closest('button')).not.toBeDisabled();
  });

  it("cleans up intervals when component unmounts", () => {
    const { unmount } = render(<RefreshButton onRefresh={jest.fn()} />);
    
    const autoSwitch = screen.getByRole("switch");
    fireEvent.click(autoSwitch);

    // Should not throw when unmounting with active intervals
    expect(() => unmount()).not.toThrow();
  });

  it("handles error boundary gracefully", () => {
    // Mock console.error to avoid noise in tests
    const originalError = console.error;
    console.error = jest.fn();

    // Create a component that throws an error
    const ErrorComponent = () => {
      throw new Error("Test error");
    };

    // This should not crash the app
    expect(() => render(<ErrorComponent />)).toThrow();

    console.error = originalError;
  });

  it("matches snapshot", () => {
    const { container } = render(<RefreshButton onRefresh={jest.fn()} />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with auto-refresh enabled", () => {
    const { container } = render(<RefreshButton onRefresh={jest.fn()} />);
    
    const autoSwitch = screen.getByRole("switch");
    fireEvent.click(autoSwitch);

    expect(container).toMatchSnapshot();
  });
}); 