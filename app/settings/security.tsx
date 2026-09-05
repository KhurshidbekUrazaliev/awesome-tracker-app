import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import SecuritySettings from '@/modules/settings/components/SecuritySettings';

export default function SecurityScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Security', headerShown: true }} />
      <ScrollView className="flex-1 bg-gray-50 dark:bg-navy-950">
        <View className="p-6">
          <Text className="text-sm text-gray-500 dark:text-navy-300 mb-4">
            Enhance your account security
          </Text>
          <SecuritySettings />
        </View>
      </ScrollView>
    </>
  );
}
