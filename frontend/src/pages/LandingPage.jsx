import React, { useState } from "react";
import datapulseLogo from "../../public/datapulse-logo.svg";
import { ChartBarIcon, CurrencyDollarIcon, NewspaperIcon, CloudIcon, GlobeAltIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

const FEATURES = [
  { label: "Stocks", icon: <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /> },
  { label: "Crypto", icon: <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /> },
  { label: "News", icon: <NewspaperIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /> },
  { label: "Weather", icon: <CloudIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /> },
  { label: "Exchange Rates", icon: <GlobeAltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /> },
  { label: "And More!", icon: <ExclamationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /> },
];

const LandingPage = ({ onContinue }) => {
  const [showFeatures, setShowFeatures] = useState(false);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row overflow-hidden select-none">
      {/* Left: Logo, DataPulse, Hero, Arrow, Features */}
      <div className="flex flex-col justify-center w-full md:w-1/2 bg-white dark:bg-gray-900 px-6 md:px-16 py-10 md:py-0">
        {/* Logo + DataPulse */}
        <div className="flex items-center gap-4 mb-8">
          <img src={datapulseLogo} alt="DataPulse Logo" className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20" />
          <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">DataPulse</span>
        </div>
        {/* Hero Section */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 text-left">Your daily data in one place</h2>
        <p className="text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-200 mb-4 text-left">
          Get real-time insights on everything that matters to you, all in one beautiful dashboard.
        </p>
        {/* Arrow Button */}
        <button
          aria-label="Show features"
          className="group flex items-center gap-2 focus:outline-none mb-2 mt-2"
          onClick={() => setShowFeatures(v => !v)}
          tabIndex={0}
        >
          <span className={`transition-transform duration-300 text-blue-600 dark:text-blue-400 text-3xl font-bold select-none ${showFeatures ? 'rotate-180' : ''}`}>^</span>
          <span className="text-sm text-blue-600 dark:text-blue-400 opacity-80 font-medium">See what you can do</span>
        </button>
        {/* Features List Animation */}
        <div
          className={`transition-all duration-500 ease-in-out ${showFeatures ? 'opacity-100 max-h-[400px] mt-2' : 'opacity-0 max-h-0 overflow-hidden'}`}
        >
          <ul className="bg-white/95 dark:bg-gray-900/95 rounded-xl shadow-xl px-6 md:px-8 py-6 space-y-4 border border-blue-100 dark:border-blue-900 backdrop-blur-md min-w-[180px] md:min-w-[220px]">
            {FEATURES.map((f, i) => (
              <li key={f.label} className={`flex items-center gap-3 text-base md:text-lg font-medium text-blue-700 dark:text-blue-300 tracking-wide animate-float`} style={{ animationDelay: `${i * 0.07}s` }}>
                {f.icon}
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Right: Blue background with Continue button */}
      <div className="md:flex flex-col justify-center items-end w-full md:w-1/2 bg-blue-600 dark:bg-blue-400 px-0 md:px-16 py-0 md:py-0">
        {/* Desktop: Centered button */}
        <button
          onClick={onContinue}
          className="hidden md:block text-white text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight cursor-pointer transition-opacity duration-200 hover:opacity-80 hover:underline focus:outline-none"
          style={{ minWidth: 140 }}
        >
          Continue
        </button>
        {/* Mobile: Fixed bar at bottom */}
        <div className="block md:hidden w-full fixed bottom-0 left-0 bg-blue-600 dark:bg-blue-400 h-24 flex items-center justify-center z-50">
          <button
            onClick={onContinue}
            className="text-white text-2xl font-bold tracking-tight cursor-pointer transition-opacity duration-200 hover:opacity-80 hover:underline focus:outline-none"
            style={{ minWidth: 100 }}
          >
            Continue
          </button>
        </div>
      </div>
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; }
        @media (max-width: 767px) {
          .min-w-[180px] { min-width: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage; 