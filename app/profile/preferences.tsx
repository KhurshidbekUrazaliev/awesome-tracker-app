import React from 'react';
import { View, ScrollView } from 'react-native';
import Text from '@/components/Text';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import NotificationToggle from '@/modules/settings/components/NotificationToggle';

export default function PreferencesScreen() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Preferences', headerShown: true }} />
      <ScrollView className="flex-1 bg-white dark:bg-navy-950">
        <View className="px-6 py-4">
          <Text className="text-sm text-gray-500 dark:text-navy-300 mb-4">
            Customize your app experience
          </Text>
          
          <NotificationToggle
            title="Dark Mode"
            description="Use dark theme"
            value={isDark}
            onValueChange={toggleTheme}
          />
        </View>
      </ScrollView>
    </>
  );
}
