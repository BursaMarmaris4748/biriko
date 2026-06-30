import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const THEME_KEY = '@biriko/theme';

const light = {
  bg: '#f2f5f9', card: '#ffffff', border: '#e8ecf4',
  text: '#151c27', text2: '#727786', text3: '#9ca3af',
  inverse: '#ffffff', accent: '#0058bc', accentLight: '#f0f7ff',
  green: '#10b981', red: '#ba1a1a', greenBg: '#d1fae5', redBg: '#fce8ed',
  tabBar: '#ffffff', tabBorder: '#e8ecf4', headerBg: '#0058bc',
  inputBg: '#f8f9fc', shimmer: '#f0f2f5', overlay: 'rgba(0,0,0,0.5)',
};

const dark = {
  bg: '#0a0a14', card: '#16162a', border: '#2a2a40',
  text: '#f1f5f9', text2: '#94a3b8', text3: '#64748b',
  inverse: '#0a0a14', accent: '#3b82f6', accentLight: '#1e293b',
  green: '#22c55e', red: '#ef4444', greenBg: '#14532d', redBg: '#450a0a',
  tabBar: '#16162a', tabBorder: '#2a2a40', headerBg: '#1e1e3a',
  inputBg: '#22223a', shimmer: '#2a2a40', overlay: 'rgba(0,0,0,0.7)',
};

type ThemeColors = typeof light;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false, colors: light,
  toggle: () => {}, setDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'dark') setIsDark(true);
      else if (val === 'light') setIsDark(false);
      else setIsDark(system === 'dark');
      setReady(true);
    });
  }, []);

  const toggle = useCallback(async () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const setDark = useCallback(async (v: boolean) => {
    setIsDark(v);
    await AsyncStorage.setItem(THEME_KEY, v ? 'dark' : 'light');
  }, []);

  if (!ready) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? dark : light, toggle, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
