import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/modules/auth/hooks/useAuth';

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-navy-950">
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</Text>

        <View className="space-y-2">
          <Link href="/settings/notifications" asChild>
            <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900 dark:text-white">🔔 Notifications</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">Manage notification preferences</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/settings/security" asChild>
            <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900 dark:text-white">🔒 Security</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">Two-factor auth and biometrics</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/settings/blocked" asChild>
            <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900 dark:text-white">🚫 Blocked Users</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">People you won&apos;t see or hear from</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity onPress={logout} className="mt-8 mb-2 self-center flex-row items-center">
          <Ionicons name="log-out-outline" size={16} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-1.5">Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
