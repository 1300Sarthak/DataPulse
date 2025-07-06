import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Skeleton, Chip, Button } from "@heroui/react";
import { useSettings } from "../context/SettingsContext";
import { useApiService } from "../services/api";

const WeatherCard = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUnit, setCurrentUnit] = useState('F');
  const { settings, updateSetting } = useSettings();
  const apiService = useApiService();

  const fetchWeather = async (unit = settings.weather.unit) => {
    setLoading(true);
    setError(null);

    try {
      let city = settings.weather.city;
      
      // Use geolocation if autoLocation is enabled
      if (settings.weather.autoLocation) {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding to get city name
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
        );
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.length > 0) {
            city = geoData[0].name;
          }
        }
      }

      // Use backend API instead of direct OpenWeather call
      const data = await apiService.getWeather(city, unit);
      
      setWeather({
        city: data.city,
        temp: data.temp,
        desc: data.desc,
        icon: data.icon,
        humidity: data.humidity,
        windSpeed: data.wind_speed,
        feelsLike: data.feels_like,
        pressure: data.pressure,
        visibility: data.visibility
      });
      setCurrentUnit(unit);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWeatherClick = async () => {
    const newUnit = currentUnit === 'F' ? 'C' : 'F';
    updateSetting('weather', 'unit', newUnit);
    await fetchWeather(newUnit);
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false
      });
    });
  };

  useEffect(() => {
    fetchWeather();
  }, [settings.weather]); // Re-fetch when weather settings change

  const getWindUnit = () => {
    return settings.weather.unit === 'F' ? 'mph' : 'm/s';
  };

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  const getWeatherGradient = (iconCode) => {
    if (iconCode?.startsWith('01')) return 'from-yellow-400 via-orange-400 to-orange-500';
    if (iconCode?.startsWith('02')) return 'from-blue-300 via-blue-400 to-blue-600';
    if (iconCode?.startsWith('03') || iconCode?.startsWith('04')) return 'from-gray-300 via-gray-400 to-gray-600';
    if (iconCode?.startsWith('09') || iconCode?.startsWith('10')) return 'from-blue-400 via-blue-500 to-blue-700';
    if (iconCode?.startsWith('11')) return 'from-purple-400 via-purple-500 to-purple-700';
    if (iconCode?.startsWith('13')) return 'from-blue-100 via-blue-200 to-blue-400';
    if (iconCode?.startsWith('50')) return 'from-gray-200 via-gray-300 to-gray-500';
    return 'from-blue-300 via-blue-400 to-blue-600';
  };

  const getWeatherAnimation = (iconCode) => {
    if (iconCode?.startsWith('01')) return 'animate-pulse';
    if (iconCode?.startsWith('02')) return 'animate-bounce';
    if (iconCode?.startsWith('09') || iconCode?.startsWith('10')) return 'animate-ping';
    if (iconCode?.startsWith('11')) return 'animate-pulse';
    return '';
  };

  if (error) {
    return (
      <Card className="col-span-1 row-span-1 rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200 card-light dark:card-dark">
        <CardBody className="flex flex-col justify-center items-center p-4">
          <div className="text-red-600 dark:text-red-400 text-center">
            <p className="text-sm font-medium">Weather Unavailable</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card 
      className={`col-span-1 row-span-1 rounded-2xl shadow-md hover:scale-[1.02] transition-all duration-300 card-light dark:card-dark overflow-hidden hover:shadow-lg ${weather?.icon?.startsWith('01') ? 'hover:shadow-yellow-200' : weather?.icon?.startsWith('09') || weather?.icon?.startsWith('10') ? 'hover:shadow-blue-200' : 'hover:shadow-gray-200'}`}
    >
      <CardBody 
        className="p-4 flex flex-col h-full cursor-pointer relative z-20"
        onClick={(e) => {
          console.log('CardBody clicked!', e);
          handleWeatherClick();
        }}
      >
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-8 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ) : (
          <>
            {/* Weather Icon Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getWeatherGradient(weather?.icon)} opacity-10`} />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm transition-colors">Weather</h3>
              <div className={`text-2xl ${getWeatherAnimation(weather?.icon)}`}>
                {getWeatherIcon(weather?.icon)}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center relative z-10">
              {/* Temperature */}
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                {weather?.temp}°{currentUnit}
              </div>
              
              {/* City */}
              <div className="text-sm text-gray-600 dark:text-gray-100 transition-colors mb-2">
                {weather?.city}
              </div>
              
              {/* Description */}
              {weather?.desc && (
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize transition-colors mb-3">
                  {weather.desc}
                </div>
              )}
              
              {/* Weather Details */}
              <div className="space-y-1">
                {/* Feels Like */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Feels like</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {weather?.feelsLike}°{currentUnit}
                  </span>
                </div>
                
                {/* Humidity */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Humidity</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {weather?.humidity}%
                  </span>
                </div>
                
                {/* Wind Speed */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Wind</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {weather?.windSpeed} {getWindUnit()}
                  </span>
                </div>
              </div>
              
              {/* Click hint */}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                Click to toggle °F/°C
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default WeatherCard; 