import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme, toggleTheme } = useThemeStore();

  const activeTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = activeTheme === 'dark';

  // Mirrors the navy/primary scale in tailwind.config.js ("Harvest & Ink") —
  // for the handful of places (ActivityIndicator, StatusBar) that need a raw
  // color instead of a className.
  const colors = {
    background: isDark ? '#131d17' : '#f6f7f2',
    card: isDark ? '#1a251e' : '#FFFFFF',
    border: isDark ? '#2b382e' : '#dcdfd4',
    primary: isDark ? '#e0a252' : '#b8660f',
    text: {
      primary: isDark ? '#eaeee5' : '#1c2620',
      secondary: isDark ? '#9fad9f' : '#5b6a5e',
      tertiary: isDark ? '#7a8a79' : '#8a9385',
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
