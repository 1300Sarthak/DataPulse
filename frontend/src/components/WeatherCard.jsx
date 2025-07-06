import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Skeleton, Chip } from "@heroui/react";
import { useSettings } from "../context/SettingsContext";
import { useApiService } from "../services/api";

const WeatherCard = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { settings } = useSettings();
  const apiService = useApiService();

  const fetchWeather = async () => {
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
      const data = await apiService.getWeather(city, settings.weather.unit);
      
      setWeather({
        city: data.city,
        temp: data.temp,
        desc: data.desc
      });
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const getTempUnit = () => {
    return settings.weather.unit === 'F' ? '°F' : '°C';
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
    <Card className="col-span-1 row-span-1 rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200 card-light dark:card-dark">
      <CardBody className="p-4 flex flex-col h-full">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-8 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm transition-colors">Weather</h3>
            </div>
            {/* Content */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                {weather?.temp}{getTempUnit()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-100 transition-colors">
                {weather?.city}
              </div>
              {weather?.desc && (
                <div className="text-xs text-gray-500 dark:text-gray-100 mt-1 capitalize transition-colors">
                  {weather.desc}
                </div>
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default WeatherCard; 