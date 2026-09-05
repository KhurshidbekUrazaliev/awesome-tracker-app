import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme, toggleTheme } = useThemeStore();

  const activeTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = activeTheme === 'dark';

  // Mirrors the navy/violet scale in tailwind.config.js — for the handful of
  // places (ActivityIndicator, StatusBar) that need a raw color instead of
  // a className.
  const colors = {
    background: isDark ? '#0a0e1a' : '#FFFFFF',
    card: isDark ? '#1a2140' : '#F9FAFB',
    border: isDark ? '#262e52' : '#E5E7EB',
    primary: isDark ? '#a78bfa' : '#7c3aed',
    text: {
      primary: isDark ? '#f4f5f9' : '#111827',
      secondary: isDark ? '#9aa1bb' : '#6B7280',
      tertiary: isDark ? '#6b7494' : '#9CA3AF',
    },
  };

  return {
    theme,
    activeTheme,
    isDark,
    colors,
    setTheme,
    toggleTheme,
  };
}
