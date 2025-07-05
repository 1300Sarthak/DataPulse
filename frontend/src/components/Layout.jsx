import React from 'react';
import AppNavbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppNavbar />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout; 