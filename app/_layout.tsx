import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
