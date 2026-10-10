import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'jakariyas_mart_theme_v1';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default is STRICTLY 'light' as requested by the user ("by default jeno light theme thake")
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      return 'light'; // Strict default
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }

    // Apply class and data attribute to document root
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
