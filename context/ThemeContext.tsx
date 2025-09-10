'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export enum AppTheme {
  netflixDark = 'netflixDark',
  primeVideoDark = 'primeVideoDark',
  disneyPlusDark = 'disneyPlusDark',
  huluDark = 'huluDark',
  hboMaxDark = 'hboMaxDark',
  amoledDark = 'amoledDark',
  light = 'light',
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
}

const themes: Record<AppTheme, ThemeColors> = {
  [AppTheme.netflixDark]: {
    primary: '#E50914',
    secondary: '#564D4D',
    background: '#141414',
    surface: '#1F1F1F',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    accent: '#E50914',
    error: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FFC107',
  },
  [AppTheme.primeVideoDark]: {
    primary: '#00A8E1',
    secondary: '#F5C518',
    background: '#0F171E',
    surface: '#1A242F',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    accent: '#00A8E1',
    error: '#FF6B6B',
    success: '#4CAF50',
    warning: '#F5C518',
  },
  [AppTheme.disneyPlusDark]: {
    primary: '#0063E5',
    secondary: '#30B2FF',
    background: '#1A1D29',
    surface: '#252836',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    accent: '#0063E5',
    error: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FFC107',
  },
  [AppTheme.huluDark]: {
    primary: '#1CE783',
    secondary: '#6ECB63',
    background: '#0B0C0F',
    surface: '#1A1C22',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    accent: '#1CE783',
    error: '#FF6B6B',
    success: '#1CE783',
    warning: '#FFC107',
  },
  [AppTheme.hboMaxDark]: {
    primary: '#9646FA',
    secondary: '#FF7EB3',
    background: '#101116',
    surface: '#1C1C25',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    accent: '#9646FA',
    error: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FFC107',
  },
  [AppTheme.amoledDark]: {
    primary: '#FFFFFF',
    secondary: '#1CE783',
    background: '#000000',
    surface: '#121212',
    textPrimary: '#FFFFFF',
    textSecondary: '#808080',
    accent: '#1CE783',
    error: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FFC107',
  },
  [AppTheme.light]: {
    primary: '#00A8E1',
    secondary: '#F5C518',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    textPrimary: '#212121',
    textSecondary: '#757575',
    accent: '#00A8E1',
    error: '#D32F2F',
    success: '#4CAF50',
    warning: '#FF9800',
  },
};

interface ThemeContextType {
  currentTheme: AppTheme;
  colors: ThemeColors;
  setTheme: (theme: AppTheme) => void;
  toggleDarkThemeVariant: () => void;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(AppTheme.huluDark);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load theme from localStorage on mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('djafro_theme');
      if (savedTheme && Object.values(AppTheme).includes(savedTheme as AppTheme)) {
        setCurrentTheme(savedTheme as AppTheme);
      }
    }
  }, []);

  // Save theme to localStorage and update CSS variables
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('djafro_theme', currentTheme);
      updateCSSVariables(themes[currentTheme]);
    }
  }, [currentTheme, isHydrated]);

  const updateCSSVariables = (colors: ThemeColors) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-background', colors.background);
      root.style.setProperty('--color-surface', colors.surface);
      root.style.setProperty('--color-text-primary', colors.textPrimary);
      root.style.setProperty('--color-text-secondary', colors.textSecondary);
      root.style.setProperty('--color-accent', colors.accent);
      root.style.setProperty('--color-error', colors.error);
      root.style.setProperty('--color-success', colors.success);
      root.style.setProperty('--color-warning', colors.warning);
    }
  };

  const setTheme = (theme: AppTheme) => {
    if (currentTheme === theme) return;
    setCurrentTheme(theme);
  };

  const toggleDarkThemeVariant = () => {
    const darkThemes = [
      AppTheme.netflixDark,
      AppTheme.primeVideoDark,
      AppTheme.disneyPlusDark,
      AppTheme.huluDark,
      AppTheme.hboMaxDark,
      AppTheme.amoledDark,
    ];

    const currentIndex = darkThemes.indexOf(currentTheme);
    if (currentIndex === -1) {
      // If not on a dark theme, go to first dark theme
      setTheme(darkThemes[0]);
    } else {
      // Cycle to next dark theme
      const nextIndex = (currentIndex + 1) % darkThemes.length;
      setTheme(darkThemes[nextIndex]);
    }
  };

  const toggleThemeMode = () => {
    if (currentTheme === AppTheme.light) {
      setTheme(AppTheme.huluDark);
    } else {
      setTheme(AppTheme.light);
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    colors: themes[currentTheme],
    setTheme,
    toggleDarkThemeVariant,
    toggleThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};