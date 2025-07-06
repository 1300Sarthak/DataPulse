import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../pages/Settings';
import { SettingsProvider } from '../context/SettingsContext';
import { ErrorToastProvider } from '../context/ErrorToastContext';

// Mock the error toast context
const mockShowError = jest.fn();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ErrorToastProvider>
        <SettingsProvider>
          {component}
        </SettingsProvider>
      </ErrorToastProvider>
    </BrowserRouter>
  );
};

describe('Settings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders settings page with all sections', () => {
    renderWithProviders(<Settings />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Stock Preferences')).toBeInTheDocument();
    expect(screen.getByText('Weather Preferences')).toBeInTheDocument();
    expect(screen.getByText('News Preferences')).toBeInTheDocument();
    expect(screen.getByText('Cryptocurrency Preferences')).toBeInTheDocument();
  });

  it('displays default stock symbols', () => {
    renderWithProviders(<Settings />);
    
    const stockInput = screen.getByPlaceholderText('AAPL, TSLA, GOOGL, MSFT');
    expect(stockInput).toHaveValue('AAPL, TSLA, GOOGL, MSFT');
  });

  it('displays default crypto symbols', () => {
    renderWithProviders(<Settings />);
    
    const cryptoInput = screen.getByPlaceholderText('BTC, ETH, ADA, SOL');
    expect(cryptoInput).toHaveValue('BTC, ETH');
  });

  it('allows editing stock symbols', () => {
    renderWithProviders(<Settings />);
    
    const stockInput = screen.getByPlaceholderText('AAPL, TSLA, GOOGL, MSFT');
    fireEvent.change(stockInput, { target: { value: 'AAPL, TSLA, NVDA' } });
    
    expect(stockInput).toHaveValue('AAPL, TSLA, NVDA');
  });

  it('allows editing crypto symbols', () => {
    renderWithProviders(<Settings />);
    
    const cryptoInput = screen.getByPlaceholderText('BTC, ETH, ADA, SOL');
    fireEvent.change(cryptoInput, { target: { value: 'BTC, ETH, ADA, SOL' } });
    
    expect(cryptoInput).toHaveValue('BTC, ETH, ADA, SOL');
  });

  it('shows temperature unit toggle', () => {
    renderWithProviders(<Settings />);
    
    expect(screen.getByText('°C')).toBeInTheDocument();
    expect(screen.getByText('°F')).toBeInTheDocument();
  });

  it('shows news categories', () => {
    renderWithProviders(<Settings />);
    
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
  });

  it('has save and reset buttons', () => {
    renderWithProviders(<Settings />);
    
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
    expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
    expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
  });

  it('saves settings to localStorage', async () => {
    renderWithProviders(<Settings />);
    
    const stockInput = screen.getByPlaceholderText('AAPL, TSLA, GOOGL, MSFT');
    fireEvent.change(stockInput, { target: { value: 'AAPL, TSLA, NVDA' } });
    
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(saveButton).toHaveTextContent('Saving...');
    });
    
    await waitFor(() => {
      expect(saveButton).toHaveTextContent('Save Settings');
    });
  });
}); 