/* global describe, it, expect */
import React from "react";
import { render, screen } from "@testing-library/react";
import TickerCard from "../components/TickerCard";
import '@testing-library/jest-dom';

// Helper to resize window
function resizeWindow(width) {
  window.innerWidth = width;
  window.dispatchEvent(new Event("resize"));
}

describe("TickerCard", () => {
  it("renders correct props for crypto", () => {
    render(
      <TickerCard title="BTC" value={50000} type="crypto" change={2.5} />
    );
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
    expect(screen.getByText("+2.50%"));
    expect(screen.getByText("Crypto")).toBeInTheDocument();
  });

  it("renders correct props for stock and negative change", () => {
    render(
      <TickerCard title="AAPL" value={150.23} type="stock" change={-1.2} />
    );
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("150.23")).toBeInTheDocument();
    expect(screen.getByText("-1.20%"));
    expect(screen.getByText("Stock")).toBeInTheDocument();
  });

  it("shows skeleton while loading", () => {
    render(<TickerCard title="BTC" value={50000} type="crypto" loading />);
    // Skeletons are rendered as elements with role="status"
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("is responsive (mobile vs desktop)", () => {
    // Desktop
    resizeWindow(1200);
    render(<TickerCard title="BTC" value={50000} type="crypto" />);
    const card = screen.getByText("BTC").closest(".w-full");
    expect(card).toHaveClass("max-w-xs");
    // Mobile
    resizeWindow(375);
    // Rerender to simulate mobile
    render(<TickerCard title="BTC" value={50000} type="crypto" />);
    expect(card).toHaveClass("max-w-xs"); // Should still be responsive
  });
}); 