import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import ListingsFeed from '@/modules/listings/components/ListingsFeed';

export default function ListingsScreen() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-navy-950">
      <Stack.Screen options={{ title: 'Share & Discover', headerShown: true }} />
      <ListingsFeed />
    </View>
  );
}
