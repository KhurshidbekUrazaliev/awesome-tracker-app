import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/store/useUserStore';
import '../global.css';

/** Keeps NativeWind's `dark:` variant classes in sync with useThemeStore's persisted choice. */
function ThemeSync() {
  const { activeTheme } = useTheme();
  const { setColorScheme } = useNativewindColorScheme();

  useEffect(() => {
    setColorScheme(activeTheme === 'dark' ? 'dark' : 'light');
  }, [activeTheme, setColorScheme]);

  return null;
}

/** Requests notification permission and registers the push token — only meaningful once signed in. */
function PushNotificationSync() {
  useNotifications();
  return null;
}

export default function RootLayout() {
  const { isDark, colors } = useTheme();
  const { isAuthenticated } = useUserStore();

  return (
    <SafeAreaProvider>
      <ThemeSync />
      {isAuthenticated && <PushNotificationSync />}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text.primary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="listings" options={{ headerShown: false }} />
        <Stack.Screen name="rooms" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
