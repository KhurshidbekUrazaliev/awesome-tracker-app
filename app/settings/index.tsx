import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>
        
        <View className="space-y-2">
          <Link href="/settings/notifications" asChild>
            <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900">🔔 Notifications</Text>
              <Text className="text-sm text-gray-500 mt-1">Manage notification preferences</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/settings/security" asChild>
            <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900">🔒 Security</Text>
              <Text className="text-sm text-gray-500 mt-1">Two-factor auth and biometrics</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
