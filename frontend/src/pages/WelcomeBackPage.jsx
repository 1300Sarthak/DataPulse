import React, { useState, useEffect } from "react";
import datapulseLogo from "../../public/datapulse-logo.svg";

const WelcomeBackPage = ({ onComplete, children }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const startTime = Date.now();
    const duration = 3000;
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(onComplete, 500);
        }, 200);
      }
    };
    requestAnimationFrame(updateProgress);
  }, [onComplete]);

  if (!isVisible) {
    return children;
  }

  return (
    <div className="relative">
      {/* Background Dashboard */}
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
      {/* Welcome Back Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/20 backdrop-blur-sm transition-all duration-500">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-md w-full mx-4">
          <div className="text-center">
            {/* DataPulse SVG Logo */}
            <div className="mb-6 flex flex-col items-center">
              <img
                src={datapulseLogo}
                alt="DataPulse Logo"
                className="w-20 h-20 mb-4 drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }}
              />
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Loading your dashboard...
              </p>
            </div>
            {/* Custom Loading Bar */}
            <div className="mb-6">
              <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {Math.round(progress)}% complete
              </p>
            </div>
            {/* Loading Message */}
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {progress < 25 && "Initializing..."}
              {progress >= 25 && progress < 50 && "Loading market data..."}
              {progress >= 50 && progress < 75 && "Fetching latest news..."}
              {progress >= 75 && progress < 100 && "Almost ready..."}
              {progress >= 100 && "Ready!"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackPage; 