import React, { createContext, useState, useEffect } from 'react';

const UserVisitContext = createContext();

export const UserVisitProvider = ({ children }) => {
  const [hasVisitedToday, setHasVisitedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has visited today
    const lastVisit = localStorage.getItem('datapulse_last_visit');
    const today = new Date().toDateString();
    
    if (lastVisit === today) {
      setHasVisitedToday(true);
    } else {
      setHasVisitedToday(false);
    }
    
    setIsLoading(false);
  }, []);

  const markAsVisitedToday = () => {
    const today = new Date().toDateString();
    localStorage.setItem('datapulse_last_visit', today);
    setHasVisitedToday(true);
  };

  const resetVisit = () => {
    localStorage.removeItem('datapulse_last_visit');
    setHasVisitedToday(false);
  };

  return (
    <UserVisitContext.Provider value={{ hasVisitedToday, isLoading, markAsVisitedToday, resetVisit }}>
      {children}
    </UserVisitContext.Provider>
  );
};

export { UserVisitContext }; 