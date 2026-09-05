import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';

export default function HomeScreen() {
  const { user, isAuthenticated } = useUserStore();
  const { logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-navy-950 px-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</Text>
        <Text className="text-base text-gray-600 dark:text-navy-300 text-center mb-8">
          Sign in to access your account
        </Text>
        <Link href="/auth/login" asChild>
          <Button title="Sign In" fullWidth />
        </Link>
        <Link href="/auth/signup" asChild>
          <Button title="Sign Up" variant="outline" fullWidth style={{ marginTop: 12 }} />
        </Link>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-navy-950">
      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Avatar uri={user.avatar} name={user.name} size="lg" />
            <View className="ml-4">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300">{user.email}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</Text>
          <View className="space-y-3">
            <Link href="/chat" asChild>
              <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm">
                <Text className="text-base font-medium text-gray-900 dark:text-white">💬 Messages</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/profile" asChild>
              <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm">
                <Text className="text-base font-medium text-gray-900 dark:text-white">👤 Profile</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/settings" asChild>
              <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm">
                <Text className="text-base font-medium text-gray-900 dark:text-white">⚙️ Settings</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Logout */}
        <Button title="Logout" variant="danger" onPress={logout} />
      </View>
    </ScrollView>
  );
}
