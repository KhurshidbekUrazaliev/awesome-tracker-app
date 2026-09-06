import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import Avatar from '@/components/Avatar';
import Loader from '@/components/Loader';
import { useBlockedUsers } from '@/modules/safety/hooks/useBlockedUsers';

export default function BlockedUsersScreen() {
  const { blockedUsers, isLoading, error, unblock } = useBlockedUsers();

  return (
    <View className="flex-1 bg-white dark:bg-navy-950">
      <Stack.Screen options={{ title: 'Blocked Users', headerShown: true }} />
      {isLoading && blockedUsers.length === 0 ? (
        <Loader fullScreen />
      ) : error && blockedUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={36} color="#93A08F" />
          <Text className="text-gray-500 dark:text-navy-300 mt-3 text-center">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <View className="flex-row items-center">
                <Avatar uri={item.user.avatar} name={item.user.name} size="md" />
                <Text className="text-base font-medium text-gray-900 dark:text-white ml-3">{item.user.name}</Text>
              </View>
              <TouchableOpacity onPress={() => unblock(item.user.id)} className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-navy-800">
                <Text className="text-sm font-medium text-gray-700 dark:text-navy-200">Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="shield-checkmark-outline" size={36} color="#93A08F" />
              <Text className="text-gray-500 dark:text-navy-300 mt-3">You haven&apos;t blocked anyone.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
