import React, { useState } from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, Switch } from "@heroui/react";

const AppNavbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Toggle dark mode class on document
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Navbar className="bg-white dark:bg-gray-800 shadow-sm">
      <NavbarBrand>
        <Link href="/dashboard" className="font-bold text-inherit">
          DataPulse
        </Link>
      </NavbarBrand>
      
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link color="foreground" href="/dashboard">
            Dashboard
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="/stocks">
            Stocks
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="/crypto">
            Crypto
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="/weather">
            Weather
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="/news">
            News
          </Link>
        </NavbarItem>
      </NavbarContent>
      
      <NavbarContent justify="end">
        <NavbarItem>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Dark Mode</span>
            <Switch
              isSelected={isDarkMode}
              onValueChange={toggleDarkMode}
              size="sm"
            />
          </div>
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} color="primary" href="/profile" variant="flat">
            Profile
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default AppNavbar; 