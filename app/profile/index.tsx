import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import Text from '@/components/Text';
import { Link } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useReputation } from '@/modules/listings/hooks/useReputation';
import { BADGE_INFO } from '@/modules/listings/services/listingsService';
import { LISTING_TYPE_LABELS } from '@/modules/listings/store/useListingsStore';
import Avatar from '@/components/Avatar';

export default function ProfileScreen() {
  const { user } = useUserStore();
  const { summary } = useReputation(user?.id);

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-navy-950">
      <View className="items-center py-8 bg-white dark:bg-navy-900">
        <Avatar uri={user.avatar} name={user.name} size="xl" />
        <Text className="font-display text-2xl font-semibold text-gray-900 dark:text-white mt-4">{user.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-navy-300">{user.email}</Text>

        <View className="flex-row items-center mt-3 bg-gray-50 dark:bg-navy-800 px-4 py-2 rounded-full">
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text className="text-sm font-semibold text-gray-800 dark:text-navy-100 ml-1.5">
            {summary?.averageRating != null ? summary.averageRating.toFixed(1) : 'No ratings yet'}
          </Text>
          {summary && summary.totalReviews > 0 && (
            <Text className="text-sm text-gray-500 dark:text-navy-300 ml-1.5">
              ({summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'})
            </Text>
          )}
        </View>

        {summary && summary.badges.length > 0 && (
          <View className="flex-row flex-wrap justify-center mt-3 px-6" style={{ gap: 8 }}>
            {summary.badges.map((badgeId) => {
              const badge = BADGE_INFO[badgeId];
              return (
                <View key={badgeId} className="flex-row items-center bg-primary-50 dark:bg-primary-500/10 px-3 py-1.5 rounded-full">
                  <Text className="text-sm">{badge.icon}</Text>
                  <Text className="text-xs font-semibold text-primary-700 dark:text-primary-300 ml-1.5">{badge.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {summary && Object.keys(summary.byType).length > 0 && (
          <View className="w-full px-6 mt-4">
            {(Object.entries(summary.byType) as [keyof typeof summary.byType, { averageRating: number; count: number }][]).map(
              ([type, stats]) => (
                <View key={type} className="flex-row items-center justify-between py-1.5">
                  <Text className="text-sm text-gray-600 dark:text-navy-300">{LISTING_TYPE_LABELS[type]}</Text>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text className="text-sm text-gray-800 dark:text-navy-100 ml-1">
                      {stats.averageRating.toFixed(1)} ({stats.count})
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}
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
