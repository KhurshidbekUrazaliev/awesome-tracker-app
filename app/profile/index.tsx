import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import Avatar from '@/components/Avatar';

export default function ProfileScreen() {
  const { user } = useUserStore();

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="items-center py-8 bg-white">
        <Avatar uri={user.avatar} name={user.name} size="xl" />
        <Text className="text-2xl font-bold text-gray-900 mt-4">{user.name}</Text>
        <Text className="text-sm text-gray-500">{user.email}</Text>
      </View>
      
      <View className="p-6">
        <Link href="/profile/edit" asChild>
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-3">
            <Text className="text-base font-medium text-gray-900">✏️ Edit Profile</Text>
            <Text className="text-sm text-gray-500 mt-1">Update your personal information</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/profile/preferences" asChild>
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm">
            <Text className="text-base font-medium text-gray-900">⚙️ Preferences</Text>
            <Text className="text-sm text-gray-500 mt-1">Customize your experience</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}
