import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    stocks: {
      symbols: ['AAPL', 'TSLA', 'GOOGL', 'MSFT'],
      refreshInterval: 60
    },
    weather: {
      unit: 'C',
      city: 'San Francisco',
      autoLocation: true
    },
    news: {
      categories: ['business', 'technology'],
      language: 'en',
      countries: ['us'],
      timeRange: '24h',
      maxArticles: 4
    },
    crypto: {
      symbols: ['BTC', 'ETH'],
      refreshInterval: 60
    }
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('datapulse-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings) => {
    try {
      localStorage.setItem('datapulse-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Update specific setting
  const updateSetting = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    saveSettings(newSettings);
  };

  // Update entire category
  const updateCategory = (category, newCategorySettings) => {
    const newSettings = {
      ...settings,
      [category]: newCategorySettings
    };
    saveSettings(newSettings);
  };

  // Reset to defaults
  const resetSettings = () => {
    const defaultSettings = {
      stocks: {
        symbols: ['AAPL', 'TSLA', 'GOOGL', 'MSFT'],
        refreshInterval: 60
      },
      weather: {
        unit: 'C',
        city: 'San Francisco',
        autoLocation: true
      },
      news: {
        categories: ['business', 'technology'],
        language: 'en',
        countries: ['us'],
        timeRange: '24h',
        maxArticles: 4
      },
      crypto: {
        symbols: ['BTC', 'ETH'],
        refreshInterval: 60
      }
    };
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  const value = {
    settings,
    saveSettings,
    updateSetting,
    updateCategory,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 