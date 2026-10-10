import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../theme';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@futapp:theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const currentColors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: currentColors,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
