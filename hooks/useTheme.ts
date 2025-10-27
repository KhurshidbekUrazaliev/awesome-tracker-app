import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme, toggleTheme } = useThemeStore();

  const activeTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = activeTheme === 'dark';

  const colors = {
    background: isDark ? '#1F2937' : '#FFFFFF',
    foreground: isDark ? '#FFFFFF' : '#1F2937',
    card: isDark ? '#374151' : '#F9FAFB',
    border: isDark ? '#4B5563' : '#E5E7EB',
    primary: '#0284c7',
    text: {
      primary: isDark ? '#F9FAFB' : '#111827',
      secondary: isDark ? '#D1D5DB' : '#6B7280',
      tertiary: isDark ? '#9CA3AF' : '#9CA3AF',
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
