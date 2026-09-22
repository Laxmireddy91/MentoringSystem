import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { applyRoleTheme, clearRoleTheme } from '../utils/roleThemes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const { user } = useAuth();
  const prevRoleRef = useRef(user?.role);

  useEffect(() => {
    if (user?.role) {
      applyRoleTheme(user.role);
    } else {
      // Clear/reset stale theme variables on app startup & when unauthenticated
      const hasUrlRole = new URLSearchParams(window.location.search).has('role');
      if (!hasUrlRole) {
        clearRoleTheme();
      }
    }
    prevRoleRef.current = user?.role;
  }, [user?.role]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        role: user?.role || null,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
