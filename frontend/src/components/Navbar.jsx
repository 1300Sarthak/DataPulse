import React, { useState, useEffect } from 'react';
import { Navbar, NavbarBrand, Link, Button } from "@heroui/react";
import { SunIcon, MoonIcon, UserIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useUserVisit } from '../hooks/useUserVisit';

const AppNavbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { resetVisit } = useUserVisit();

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

  // Close menu on route change (optional, if using a router)
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const close = () => setMobileMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [mobileMenuOpen]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/crypto', label: 'Crypto' },
    { href: '/stocks', label: 'Stocks' },
    { href: '/news', label: 'News' },
    { href: '/weather', label: 'Weather' },
    { href: '/exchange-rate', label: 'Exchange Rate' },
  ];

  return (
    <nav className="w-full bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 relative z-50">
      <div className="flex items-center justify-between w-full px-8 py-4">
        {/* Logo left */}
        <div className="flex-shrink-0">
          <Link href="/" className="font-bold text-inherit text-2xl">
            DataPulse
          </Link>
        </div>
        {/* Nav links center (desktop) */}
        <div className="flex-1 flex justify-center">
          <div className="hidden sm:flex gap-10">
            {navLinks.map(link => (
              <Link
                key={link.href}
                color="foreground"
                href={link.href}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        {/* Hamburger icon (mobile only) */}
        <div className="sm:hidden flex items-center">
          <Button
            isIconOnly
            variant="light"
            onClick={() => setMobileMenuOpen(open => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="transition-all duration-300 hover:scale-110"
          >
            <span className={`transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}>
              <Bars3Icon className="h-7 w-7 text-gray-700 dark:text-gray-200" />
            </span>
            <span className={`absolute transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
              <XMarkIcon className="h-7 w-7 text-gray-700 dark:text-gray-200" />
            </span>
          </Button>
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
            onClick={() => setShowProfileModal(true)}
          >
            <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
      </div>
      {/* Mobile dropdown menu and backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          {/* Dropdown */}
          <div className="sm:hidden fixed top-0 left-0 w-full z-50 animate-slide-down">
            <div className="relative bg-white dark:bg-gray-800 rounded-b-2xl shadow-2xl mx-2 mt-2 pb-6 pt-4 px-6 border border-gray-200 dark:border-gray-700">
              {/* Close button inside menu */}
              <button
                className="absolute top-3 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <XMarkIcon className="h-7 w-7 text-gray-700 dark:text-gray-200" />
              </button>
              <div className="flex flex-col gap-4 mt-6">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    color="foreground"
                    href={link.href}
                    className="py-3 text-xl font-semibold rounded-lg text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* Animation keyframes */}
          <style>{`
            @keyframes slide-down {
              0% { opacity: 0; transform: translateY(-30px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-down {
              animation: slide-down 0.3s cubic-bezier(.4,0,.2,1);
            }
            .animate-fade-in {
              animation: fade-in 0.2s cubic-bezier(.4,0,.2,1);
            }
            @keyframes fade-in {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
          `}</style>
        </>
      )}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} size="sm" classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        header: "bg-white dark:bg-gray-800",
        body: "bg-white dark:bg-gray-800",
        footer: "bg-white dark:bg-gray-800"
      }}>
        <ModalContent>
          <ModalHeader>About the Creator</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-3 py-2">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">This site is built and maintained by Sarthak Sethi</span>
              <div className="flex gap-5 mt-2">
                <a href="https://github.com/1300Sarthak" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                  {/* GitHub SVG */}
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/></svg>
                  <span className="ml-1">1300Sarthak</span>
                </a>
                <a href="https://www.linkedin.com/in/sarsethi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                  {/* LinkedIn SVG */}
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.966 0-1.75-.79-1.75-1.76s.784-1.76 1.75-1.76 1.75.79 1.75 1.76-.784 1.76-1.75 1.76zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v4.74z"/></svg>
                  <span className="ml-1">sar sethi</span>
                </a>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowProfileModal(false)}>
              Close
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </nav>
  );
};

export default AppNavbar; 