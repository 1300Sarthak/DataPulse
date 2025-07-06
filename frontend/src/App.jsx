import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { ErrorToastProvider } from "./context/ErrorToastContext";
import { SettingsProvider } from "./context/SettingsContext";
import AppNavbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CryptoPage from "./pages/CryptoPage";
import StocksPage from "./pages/StocksPage";
import WeatherPage from "./pages/WeatherPage";
import ExchangeRatePage from "./pages/ExchangeRatePage";
import "./index.css";

function App() {
  return (
    <HeroUIProvider>
      <ErrorToastProvider>
        <SettingsProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <AppNavbar />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/crypto" element={<CryptoPage />} />
                  <Route path="/stocks" element={<StocksPage />} />
                  <Route path="/weather" element={<WeatherPage />} />
                  <Route path="/exchange-rate" element={<ExchangeRatePage />} />
                </Routes>
              </main>
            </div>
          </Router>
        </SettingsProvider>
      </ErrorToastProvider>
    </HeroUIProvider>
  );
}

export default App;
