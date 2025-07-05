import React, { createContext, useContext, useState, useCallback } from 'react';

const ErrorToastContext = createContext();

export const ErrorToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type: options.type || 'error',
        duration: options.duration || 5000,
      },
    ]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ErrorToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded shadow-lg bg-white dark:bg-gray-800 border-l-4 ${toast.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}
            style={{ minWidth: 240, maxWidth: 320 }}
            role="alert"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900 dark:text-white">{toast.message}</span>
              <button
                className="ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Auto-remove toasts after duration */}
      {toasts.map((toast) => (
        <AutoRemoveToast key={toast.id} id={toast.id} duration={toast.duration} removeToast={removeToast} />
      ))}
    </ErrorToastContext.Provider>
  );
};

function AutoRemoveToast({ id, duration, removeToast }) {
  React.useEffect(() => {
    const timer = setTimeout(() => removeToast(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, removeToast]);
  return null;
}

export const useErrorToast = () => {
  const ctx = useContext(ErrorToastContext);
  if (!ctx) throw new Error('useErrorToast must be used within ErrorToastProvider');
  return ctx.addToast;
}; 