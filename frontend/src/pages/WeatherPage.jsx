import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Chip,
  Spinner,
  Select,
  SelectItem,
  Divider,
  Badge
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  SunIcon,
  CloudIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import apiService from "../services/api";

const WeatherPage = () => {
  const [city, setCity] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("F"); // Default to Fahrenheit
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [carouselWeather, setCarouselWeather] = useState([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [searchedCities, setSearchedCities] = useState([]); // Search history

  // Major cities by country
  const majorCities = {
    US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
    GB: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Cardiff"],
    CA: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener"],
    AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Sunshine Coast", "Wollongong"],
    DE: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig"],
    FR: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
    JP: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama"],
    IN: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Surat", "Jaipur"],
    BR: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"],
    CN: ["Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Chengdu", "Tianjin", "Chongqing", "Nanjing", "Wuhan", "Xi'an"]
  };

  const countries = [
    { key: "US", label: "United States", flag: "🇺🇸" },
    { key: "GB", label: "United Kingdom", flag: "🇬🇧" },
    { key: "CA", label: "Canada", flag: "🇨🇦" },
    { key: "AU", label: "Australia", flag: "🇦🇺" },
    { key: "DE", label: "Germany", flag: "🇩🇪" },
    { key: "FR", label: "France", flag: "🇫🇷" },
    { key: "JP", label: "Japan", flag: "🇯🇵" },
    { key: "IN", label: "India", flag: "🇮🇳" },
    { key: "BR", label: "Brazil", flag: "🇧🇷" },
    { key: "CN", label: "China", flag: "🇨🇳" }
  ];

  // Fetch weather for carousel cities
  const fetchCarouselWeather = async (country) => {
    setCarouselLoading(true);
    const cities = majorCities[country] || [];
    const weatherPromises = cities.slice(0, 10).map(city =>
      apiService.getWeather(city, unit).catch(() => null)
    );

    try {
      const results = await Promise.all(weatherPromises);
      const validResults = results.filter(result => result && result.city).slice(0, 10);
      setCarouselWeather(validResults);
    } catch (error) {
      setCarouselWeather([]);
    } finally {
      setCarouselLoading(false);
    }
  };

  useEffect(() => {
    fetchCarouselWeather(selectedCountry);
  }, [selectedCountry, unit]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setSearchCity(city);
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const data = await apiService.getWeather(city, unit);
      if (data && data.city) {
        const cityWeather = {
          city: data.city,
          temp: data.temp,
          desc: data.desc,
          icon: data.icon,
          humidity: data.humidity,
          windSpeed: data.wind_speed,
          feelsLike: data.feels_like,
          pressure: data.pressure,
          visibility: data.visibility,
          unit: unit
        };
        setWeather(cityWeather);
        // Remove duplicate if exists, then add to front
        setSearchedCities(prev => [
          cityWeather,
          ...prev.filter(w => w.city.toLowerCase() !== cityWeather.city.toLowerCase())
        ]);
      } else if (data && data.detail && data.detail.toLowerCase().includes("not found")) {
        setError("City not found. Please check the spelling or try another city.");
      } else {
        setError("Could not find weather data for this city. Please check the spelling or try another city.");
      }
    } catch (err) {
      if (err.message && err.message.includes("404")) {
        setError("City not found. Please check the spelling or try another city.");
      } else {
        setError("Could not find weather data for this city. Please check the spelling or try another city.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnitToggle = () => {
    setUnit((prev) => (prev === "C" ? "F" : "C"));
    if (searchCity) {
      setLoading(true);
      setError(null);
      apiService.getWeather(searchCity, unit === "C" ? "F" : "C").then((data) => {
        if (data && data.city) {
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
        } else if (data && data.detail && data.detail.toLowerCase().includes("not found")) {
          setError("City not found. Please check the spelling or try another city.");
        } else {
          setError("Could not find weather data for this city. Please check the spelling or try another city.");
        }
      }).catch((err) => {
        if (err.message && err.message.includes("404")) {
          setError("City not found. Please check the spelling or try another city.");
        } else {
          setError("Could not find weather data for this city. Please check the spelling or try another city.");
        }
      }).finally(() => setLoading(false));
    }
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

  return (
    <div className="p-8">
      {/* Hero Section */}
      <div className="max-w-screen-2xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            {/* Removed globe icon here */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors mb-2">
              Weather Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-100 mt-1 transition-colors">
              Search for any city and explore weather around the world
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1" htmlFor="country-select">
              Select Country
            </label>
            <div className="flex items-center gap-4">
              <Select
                id="country-select"
                selectedKeys={[selectedCountry]}
                onSelectionChange={(keys) => {
                  const country = Array.from(keys)[0];
                  setSelectedCountry(country);
                }}
                classNames={{
                  base: "w-64",
                  trigger: "h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors",
                  popover: "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700",
                  listbox: "bg-white dark:bg-gray-800",
                  listboxItem: "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }}
              >
                {countries.map((country) => (
                  <SelectItem
                    key={country.key}
                    value={country.key}
                    startContent={<span className="text-lg">{country.flag}</span>}
                  >
                    {country.label}
                  </SelectItem>
                ))}
              </Select>
              <Button
                variant="bordered"
                color="secondary"
                onClick={handleUnitToggle}
                disabled={loading}
                className="h-12 px-6 border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                startContent={<SunIcon className="h-4 w-4" />}
              >
                {unit === "C" ? "°C" : "°F"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="max-w-screen-2xl mx-auto mb-12">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPinIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Major Cities in {countries.find(c => c.key === selectedCountry)?.label}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Current weather conditions in the top cities
          </p>
        </div>

        {carouselLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading weather data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {carouselWeather.map((cityWeather, index) => (
              <Card
                key={index}
                className="rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300 card-light dark:card-dark overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600"
              >
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl">{getWeatherIcon(cityWeather.icon)}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cityWeather.temp}°{unit}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {cityWeather.desc}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {cityWeather.city}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Feels like {cityWeather.feels_like}°{unit} • {cityWeather.humidity}% humidity
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MagnifyingGlassIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Search Any City
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Get detailed weather information for any location worldwide
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-2xl">
          <Input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Enter city name..."
            className="flex-1 h-12"
            startContent={<MapPinIcon className="h-4 w-4 text-gray-400" />}
            classNames={{
              base: "h-12",
              input: "text-base",
              inputWrapper: "h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors"
            }}
            aria-label="City name"
          />
          <Button
            type="submit"
            color="primary"
            disabled={loading || !city.trim()}
            className="h-12 px-8 font-medium"
            startContent={loading ? <Spinner size="sm" /> : <MagnifyingGlassIcon className="h-4 w-4" />}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {error && (
          <div className="mb-6 max-w-2xl">
            <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <div className="p-1 bg-red-100 dark:bg-red-800 rounded-full">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {loading && (
          <div className="mb-6 text-center max-w-2xl">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
              <CardBody className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <Spinner size="lg" color="primary" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Loading weather data...</span>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {weather && !loading && (
          <div className="max-w-2xl w-full mt-4">
            <Card className="w-full rounded-2xl shadow-lg card-light dark:card-dark overflow-hidden border-2 border-gray-100 dark:border-gray-700">
              <div className={`h-2 bg-gradient-to-r ${getWeatherGradient(weather.icon)}`} />
              <CardHeader className="flex items-center justify-between gap-2 pb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getWeatherIcon(weather.icon)}</div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{weather.city}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{weather.desc}</div>
                  </div>
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<SunIcon className="h-3 w-3" />}
                  >
                    {unit === "C" ? "Celsius" : "Fahrenheit"}
                  </Chip>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">{weather.temp}°{unit}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Current</div>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <SunIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Feels Like</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{weather.feelsLike}°{unit}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CloudIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{weather.humidity}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Wind Speed</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{weather.windSpeed} {unit === "C" ? "m/s" : "mph"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Pressure</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{weather.pressure} hPa</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <EyeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Visibility</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{weather.visibility} m</div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Search History Section */}
      {searchedCities.length > 0 && (
        <div className="max-w-screen-2xl mx-auto mt-16">
          <Divider className="mb-8" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Search History</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-8">
            {searchedCities.map((cityWeather) => (
              <Card key={cityWeather.city + cityWeather.unit} className="w-full rounded-2xl shadow-md card-light dark:card-dark overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                <div className={`h-2 bg-gradient-to-r ${getWeatherGradient(cityWeather.icon)}`} />
                <CardHeader className="flex items-center justify-between gap-2 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getWeatherIcon(cityWeather.icon)}</div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{cityWeather.city}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{cityWeather.desc}</div>
                    </div>
                    <Chip
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<SunIcon className="h-3 w-3" />}
                    >
                      {cityWeather.unit === "C" ? "Celsius" : "Fahrenheit"}
                    </Chip>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">{cityWeather.temp}°{cityWeather.unit}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Current</div>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <SunIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Feels Like</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{cityWeather.feelsLike}°{cityWeather.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CloudIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{cityWeather.humidity}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Wind Speed</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{cityWeather.windSpeed} {cityWeather.unit === "C" ? "m/s" : "mph"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pressure</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{cityWeather.pressure} hPa</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <EyeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Visibility</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{cityWeather.visibility} m</div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherPage; 