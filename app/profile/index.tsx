import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import Avatar from '@/components/Avatar';

export default function ProfileScreen() {
  const { user } = useUserStore();

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-navy-950">
      <View className="items-center py-8 bg-white dark:bg-navy-900">
        <Avatar uri={user.avatar} name={user.name} size="xl" />
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{user.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-navy-300">{user.email}</Text>
      </View>

      <View className="p-6">
        <Link href="/profile/edit" asChild>
          <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-3">
            <Text className="text-base font-medium text-gray-900 dark:text-white">✏️ Edit Profile</Text>
            <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">Update your personal information</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/profile/preferences" asChild>
          <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm">
            <Text className="text-base font-medium text-gray-900 dark:text-white">⚙️ Preferences</Text>
            <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">Customize your experience</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}
