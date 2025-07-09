import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { ErrorToastProvider } from "./context/ErrorToastContext";
import { SettingsProvider } from "./context/SettingsContext";
import { UserVisitProvider } from "./context/UserVisitContext";
import { useUserVisit } from "./hooks/useUserVisit";
import AppNavbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CryptoPage from "./pages/CryptoPage";
import StocksPage from "./pages/StocksPage";
import NewsPage from "./pages/NewsPage";
import WeatherPage from "./pages/WeatherPage";
import ExchangeRatePage from "./pages/ExchangeRatePage";
import LandingPage from "./pages/LandingPage";
import WelcomeBackPage from "./pages/WelcomeBackPage";
import "./index.css";

const AppContent = () => {
  const { hasVisitedToday, isLoading, markAsVisitedToday } = useUserVisit();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [hasVisitedBefore, setHasVisitedBefore] = useState(false);

  useEffect(() => {
    // Check if user has visited before (not just today)
    const hasVisited = localStorage.getItem('datapulse_has_visited');
    setHasVisitedBefore(!!hasVisited);
    
    // Show welcome back for returning users who haven't visited today
    if (!isLoading && hasVisitedBefore && !hasVisitedToday && !showDashboard) {
      setShowWelcomeBack(true);
    }
  }, [isLoading, hasVisitedToday, showDashboard, hasVisitedBefore]);

  const handleContinueFromLanding = () => {
    localStorage.setItem('datapulse_has_visited', 'true');
    markAsVisitedToday();
    setShowDashboard(true);
  };

  const handleWelcomeBackComplete = () => {
    setShowWelcomeBack(false);
    setShowDashboard(true);
    markAsVisitedToday();
  };

  // Show loading while checking visit status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for first-time users
  if (!hasVisitedBefore && !showDashboard) {
    return <LandingPage onContinue={handleContinueFromLanding} />;
  }

  // Main app content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showWelcomeBack ? (
        <WelcomeBackPage onComplete={handleWelcomeBackComplete}>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppNavbar />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/crypto" element={<CryptoPage />} />
                <Route path="/stocks" element={<StocksPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/exchange-rate" element={<ExchangeRatePage />} />
              </Routes>
            </main>
          </div>
        </WelcomeBackPage>
      ) : (
        <>
          <AppNavbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/crypto" element={<CryptoPage />} />
              <Route path="/stocks" element={<StocksPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/exchange-rate" element={<ExchangeRatePage />} />
            </Routes>
          </main>
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <HeroUIProvider>
      <ErrorToastProvider>
        <SettingsProvider>
          <UserVisitProvider>
            <Router>
              <AppContent />
            </Router>
          </UserVisitProvider>
        </SettingsProvider>
      </ErrorToastProvider>
    </HeroUIProvider>
  );
}

export default App;
