import { useContext } from 'react';
import { UserVisitContext } from '../context/UserVisitContext';

export const useUserVisit = () => {
  const context = useContext(UserVisitContext);
  if (!context) {
    throw new Error('useUserVisit must be used within a UserVisitProvider');
  }
  return context;
}; 