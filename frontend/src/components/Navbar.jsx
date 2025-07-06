import React, { useState, useEffect } from 'react';
import { Navbar, NavbarBrand, Link, Button } from "@heroui/react";
import { SunIcon, MoonIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const AppNavbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
    } else {
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <nav className="w-full bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between w-full px-8 py-4">
        {/* Logo left */}
        <div className="flex-shrink-0">
          <Link href="/" className="font-bold text-inherit text-2xl">
            DataPulse
          </Link>
        </div>
        {/* Nav links center */}
        <div className="flex-1 flex justify-center">
          <div className="hidden sm:flex gap-10">
            <Link color="foreground" href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Dashboard
            </Link>
            <Link color="foreground" href="/crypto" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Crypto
            </Link>
            <Link color="foreground" href="/stocks" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Stocks
            </Link>
            <Link color="foreground" href="/weather" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Weather
            </Link>
            <Link color="foreground" href="/exchange-rate" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Exchange Rate
            </Link>
            {/* Settings link removed */}
          </div>
        </div>
        {/* Icons right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            isIconOnly
            variant="light"
            as={Link}
            href="/settings"
            className="transition-all duration-300 hover:scale-110"
            aria-label="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
          <Button
            isIconOnly
            variant="light"
            onClick={toggleDarkMode}
            className="transition-all duration-300 hover:scale-110"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 text-yellow-500 animate-spin-slow" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600 animate-pulse" />
            )}
          </Button>
          <Button
            isIconOnly
            variant="light"
            className="transition-all duration-300 hover:scale-110"
            aria-label="Profile"
          >
            <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar; 