import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, SelectItem, Switch, Slider, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { useSettings } from '../context/SettingsContext';
import { useErrorToast } from '../context/ErrorToastContext';

const Settings = () => {
  const navigate = useNavigate();
  const { showError } = useErrorToast();
  const { settings, saveSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState({
    stocks: {
      symbols: settings.stocks?.symbols || ['AAPL', 'TSLA', 'GOOGL', 'MSFT'],
      refreshInterval: settings.stocks?.refreshInterval || 60
    },
    crypto: {
      symbols: settings.crypto?.symbols || ['BTC', 'ETH'],
      refreshInterval: settings.crypto?.refreshInterval || 60
    },
    weather: {
      unit: settings.weather?.unit || 'C',
      city: settings.weather?.city || 'San Francisco',
      autoLocation: settings.weather?.autoLocation !== false
    },
    news: {
      categories: settings.news?.categories || ['business', 'technology'],
      countries: settings.news?.countries || ['us'],
      timeRange: settings.news?.timeRange || '24h',
      language: settings.news?.language || 'en'
    }
  });

  // Local input states to prevent constant re-renders
  const [stockInput, setStockInput] = useState('');
  const [cryptoInput, setCryptoInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize input fields when settings are loaded
  useEffect(() => {
    if (settings.stocks.symbols) {
      setStockInput(settings.stocks.symbols.join(', '));
    }
    if (settings.crypto.symbols) {
      setCryptoInput(settings.crypto.symbols.join(', '));
    }
    if (settings.news.countries) {
      setCountryInput(settings.news.countries.join(', '));
    }
  }, [settings]);

  // Update localSettings when settings are loaded
  useEffect(() => {
    setLocalSettings({
      stocks: {
        symbols: settings.stocks?.symbols || ['AAPL', 'TSLA', 'GOOGL', 'MSFT'],
        refreshInterval: settings.stocks?.refreshInterval || 60
      },
      crypto: {
        symbols: settings.crypto?.symbols || ['BTC', 'ETH'],
        refreshInterval: settings.crypto?.refreshInterval || 60
      },
      weather: {
        unit: settings.weather?.unit || 'C',
        city: settings.weather?.city || 'San Francisco',
        autoLocation: settings.weather?.autoLocation !== false
      },
      news: {
        categories: settings.news?.categories || ['business', 'technology'],
        countries: settings.news?.countries || ['us'],
        timeRange: settings.news?.timeRange || '24h',
        language: settings.news?.language || 'en'
      }
    });
  }, [settings]);

  const handleSave = () => {
    setIsLoading(true);
    try {
      // Process input values
      const stockSymbols = stockInput
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
      
      const cryptoSymbols = cryptoInput
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
      
      const countryCodes = countryInput
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);

      const newSettings = {
        stocks: {
          ...localSettings.stocks,
          symbols: stockSymbols
        },
        crypto: {
          ...localSettings.crypto,
          symbols: cryptoSymbols
        },
        weather: localSettings.weather,
        news: {
          ...localSettings.news,
          countries: countryCodes
        }
      };

      saveSettings(newSettings);
      showError("Settings saved successfully!", "success");
      navigate('/');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
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
    setLocalSettings(defaultSettings);
    resetSettings();
  };



  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Matching Dashboard Layout */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Customize your DataPulse dashboard preferences
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                color="danger"
                variant="bordered"
                onClick={handleReset}
                className="font-medium"
              >
                Reset to Defaults
              </Button>
              
              <Button
                color="primary"
                variant="solid"
                onClick={handleSave}
                isLoading={isLoading}
                className="font-medium"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          {/* Stocks Settings */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Stock Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which stocks to display and refresh interval
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Symbols (comma-separated)
                </label>
                <Input
                  value={stockInput}
                  onChange={(e) => {
                    setStockInput(e.target.value);
                  }}
                  placeholder="AAPL, TSLA, GOOGL, MSFT"
                  className="w-full"
                  aria-label="Stock symbols separated by commas"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter stock symbols separated by commas (max 8 symbols)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refresh Interval (seconds)
                </label>
                <Slider
                  value={localSettings.stocks.refreshInterval}
                  onChange={(value) => setLocalSettings(prev => ({
                    ...prev,
                    stocks: { ...prev.stocks, refreshInterval: value }
                  }))}
                  minValue={30}
                  maxValue={300}
                  step={30}
                  className="w-full"
                  aria-label="Stock refresh interval in seconds"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {localSettings.stocks.refreshInterval} seconds
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Weather Settings */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Weather Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure weather display and location settings
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temperature Unit
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose between Celsius and Fahrenheit</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${localSettings.weather.unit === 'C' ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    °C
                  </span>
                  <Switch
                    isSelected={localSettings.weather.unit === 'F'}
                    onValueChange={(checked) => setLocalSettings(prev => ({
                      ...prev,
                      weather: { ...prev.weather, unit: checked ? 'F' : 'C' }
                    }))}
                    aria-label="Toggle temperature unit between Celsius and Fahrenheit"
                    classNames={{
                      wrapper: "group-data-[selected=true]:bg-blue-500",
                      thumb: "group-data-[selected=true]:bg-white"
                    }}
                  />
                  <span className={`text-sm ${localSettings.weather.unit === 'F' ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    °F
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default City
                </label>
                <Input
                  value={localSettings.weather.city}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    weather: { ...prev.weather, city: e.target.value }
                  }))}
                  placeholder="San Francisco"
                  className="w-full"
                  disabled={localSettings.weather.autoLocation}
                  aria-label="Default city for weather"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Use Current Location
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically detect your location</p>
                </div>
                <Switch
                  isSelected={localSettings.weather.autoLocation}
                  onValueChange={(checked) => setLocalSettings(prev => ({
                    ...prev,
                    weather: { ...prev.weather, autoLocation: checked }
                  }))}
                  aria-label="Toggle automatic location detection"
                  classNames={{
                    wrapper: "group-data-[selected=true]:bg-green-500",
                    thumb: "group-data-[selected=true]:bg-white"
                  }}
                />
              </div>
            </CardBody>
          </Card>

          {/* News Settings */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                News Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize news categories, language, and sources
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  News Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {['business', 'technology', 'sports', 'entertainment', 'health', 'science'].map((category) => (
                    <Chip
                      key={category}
                      variant={localSettings.news.categories.includes(category) ? "solid" : "bordered"}
                      color={localSettings.news.categories.includes(category) ? "primary" : "default"}
                      onClick={() => {
                        const newCategories = localSettings.news.categories.includes(category)
                          ? localSettings.news.categories.filter(c => c !== category)
                          : [...localSettings.news.categories, category];
                        setLocalSettings(prev => ({
                          ...prev,
                          news: { ...prev.news, categories: newCategories }
                        }));
                      }}
                      className="cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: localSettings.news.categories.includes(category) 
                          ? 'var(--heroui-primary-500)' 
                          : 'transparent',
                        color: localSettings.news.categories.includes(category) 
                          ? 'white' 
                          : 'inherit'
                      }}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <Select
                    selectedKeys={[localSettings.news.language]}
                    onSelectionChange={(keys) => {
                      const language = Array.from(keys)[0];
                      setLocalSettings(prev => ({
                        ...prev,
                        news: { ...prev.news, language }
                      }));
                    }}
                    aria-label="News language selection"
                    classNames={{
                      base: "bg-white dark:bg-gray-800",
                      trigger: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
                      popover: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                    }}
                  >
                    <SelectItem key="en" value="en">English</SelectItem>
                    <SelectItem key="es" value="es">Spanish</SelectItem>
                    <SelectItem key="fr" value="fr">French</SelectItem>
                    <SelectItem key="de" value="de">German</SelectItem>
                    <SelectItem key="it" value="it">Italian</SelectItem>
                    <SelectItem key="pt" value="pt">Portuguese</SelectItem>
                    <SelectItem key="ru" value="ru">Russian</SelectItem>
                    <SelectItem key="zh" value="zh">Chinese</SelectItem>
                    <SelectItem key="ja" value="ja">Japanese</SelectItem>
                    <SelectItem key="ko" value="ko">Korean</SelectItem>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Range
                  </label>
                  <Select
                    selectedKeys={[localSettings.news.timeRange]}
                    onSelectionChange={(keys) => {
                      const timeRange = Array.from(keys)[0];
                      setLocalSettings(prev => ({
                        ...prev,
                        news: { ...prev.news, timeRange }
                      }));
                    }}
                    aria-label="News time range selection"
                    classNames={{
                      base: "bg-white dark:bg-gray-800",
                      trigger: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
                      popover: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                    }}
                  >
                    <SelectItem key="1h" value="1h">Last Hour</SelectItem>
                    <SelectItem key="24h" value="24h">Last 24 Hours</SelectItem>
                    <SelectItem key="7d" value="7d">Last 7 Days</SelectItem>
                    <SelectItem key="30d" value="30d">Last 30 Days</SelectItem>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Countries (comma-separated country codes)
                </label>
                <Input
                  value={countryInput}
                  onChange={(e) => {
                    setCountryInput(e.target.value);
                  }}
                  placeholder="us, gb, ca, au"
                  className="w-full"
                  aria-label="Country codes separated by commas"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter ISO country codes (e.g., us, gb, ca, au, de, fr)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Articles
                </label>
                <Slider
                  value={localSettings.news.maxArticles}
                  onChange={(value) => setLocalSettings(prev => ({
                    ...prev,
                    news: { ...prev.news, maxArticles: value }
                  }))}
                  minValue={1}
                  maxValue={10}
                  step={1}
                  className="w-full"
                  aria-label="Maximum news articles to display"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Show {localSettings.news.maxArticles} article{localSettings.news.maxArticles !== 1 ? 's' : ''}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Crypto Settings */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cryptocurrency Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which cryptocurrencies to display
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cryptocurrency Symbols (comma-separated)
                </label>
                <Input
                  value={cryptoInput}
                  onChange={(e) => {
                    setCryptoInput(e.target.value);
                  }}
                  placeholder="BTC, ETH, ADA, SOL"
                  className="w-full"
                  aria-label="Cryptocurrency symbols separated by commas"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter cryptocurrency symbols separated by commas (max 6 symbols)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refresh Interval (seconds)
                </label>
                <Slider
                  value={localSettings.crypto.refreshInterval}
                  onChange={(value) => setLocalSettings(prev => ({
                    ...prev,
                    crypto: { ...prev.crypto, refreshInterval: value }
                  }))}
                  minValue={30}
                  maxValue={300}
                  step={30}
                  className="w-full"
                  aria-label="Cryptocurrency refresh interval in seconds"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {localSettings.crypto.refreshInterval} seconds
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings; 