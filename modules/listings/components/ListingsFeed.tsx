import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import { useColorScheme } from 'nativewind';
import Avatar from '@/components/Avatar';
import Loader from '@/components/Loader';
import { useListings } from '@/modules/listings/hooks/useListings';
import { useTrendingCategories } from '@/modules/listings/hooks/useTrendingCategories';
import { LISTING_TYPE_LABELS, LISTING_TYPES, type Listing, type ListingType } from '@/modules/listings/store/useListingsStore';
import { formatDate } from '@/utils/formatDate';

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3.5 py-1.5 rounded-full mr-2 ${
        active ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-100 dark:bg-navy-800'
      }`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-700 dark:text-navy-200'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ListingCard({ item }: { item: Listing }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      className="bg-white dark:bg-navy-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-white/10"
      activeOpacity={0.8}
      onPress={() => router.push(`/listings/detail?id=${item.id}`)}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="bg-primary-100 dark:bg-primary-500/20 px-2.5 py-1 rounded-full">
          <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">
            {LISTING_TYPE_LABELS[item.type]}
          </Text>
        </View>
        <Text className="text-xs text-gray-400 dark:text-navy-400">{formatDate(item.createdAt, 'relative')}</Text>
      </View>

      <Text className="font-display text-base font-semibold text-gray-900 dark:text-white mb-1">{item.title}</Text>
      <Text className="text-sm text-gray-600 dark:text-navy-300 mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Avatar uri={item.owner?.avatar} name={item.owner?.name} size="sm" />
          <Text className="text-xs text-gray-500 dark:text-navy-300 ml-2">{item.owner?.name ?? 'Someone'}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="pricetag-outline" size={13} color={isDark ? '#7a8a79' : '#93A08F'} />
          <Text className="text-xs text-gray-400 dark:text-navy-400 ml-1">{item.category}</Text>
          {item.distanceKm != null && (
            <>
              <Ionicons name="location-outline" size={13} color={isDark ? '#7a8a79' : '#93A08F'} style={{ marginLeft: 8 }} />
              <Text className="text-xs text-gray-400 dark:text-navy-400 ml-1">{item.distanceKm.toLocaleString()} km</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * The browse/search/create feed — shared by the "Share & Discover" screen and
 * the signed-in home screen, which embeds this directly rather than just
 * linking to it (see docs/PRODUCT_PLAN.md §7, "Remove / repurpose").
 */
export default function ListingsFeed() {
  const { listings, isLoading, error, search, filters } = useListings();
  const trendingCategories = useTrendingCategories();
  const [query, setQuery] = useState('');

  const activeType = filters.type;
  const applyType = (type?: ListingType) => search({ ...filters, type });
  const submitSearch = () => search({ ...filters, q: query.trim() || undefined });
  const toggleCategory = (category: string) =>
    search({ ...filters, category: filters.category === category ? undefined : category });
  const toggleNearMe = () => search({ ...filters, sortByDistance: !filters.sortByDistance });

  return (
    <View style={{ flex: 1 }}>
      <View className="px-6 pt-4 pb-3 bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-white/10">
        <View className="flex-row items-center bg-gray-100 dark:bg-navy-800 rounded-xl px-3 mb-3">
          <Ionicons name="search-outline" size={18} color="#93A08F" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            placeholder="Search ideas, lessons, things to give or trade…"
            placeholderTextColor="#93A08F"
            className="flex-1 py-2.5 px-2 text-sm text-gray-900 dark:text-white"
            returnKeyType="search"
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[undefined, ...LISTING_TYPES] as (ListingType | undefined)[]}
          keyExtractor={(t) => t ?? 'all'}
          renderItem={({ item: type }) => (
            <FilterChip
              label={type ? LISTING_TYPE_LABELS[type] : 'All'}
              active={activeType === type}
              onPress={() => applyType(type)}
            />
          )}
          ListFooterComponent={<FilterChip label="📍 Near me" active={!!filters.sortByDistance} onPress={toggleNearMe} />}
        />

        {trendingCategories.length > 0 && (
          <View className="flex-row items-center mt-2.5">
            <Ionicons name="trending-up-outline" size={14} color="#93A08F" style={{ marginRight: 6 }} />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={trendingCategories}
              keyExtractor={(c) => c.category}
              renderItem={({ item }) => (
                <FilterChip
                  label={item.category}
                  active={filters.category === item.category}
                  onPress={() => toggleCategory(item.category)}
                />
              )}
            />
          </View>
        )}
      </View>

      {isLoading && listings.length === 0 ? (
        <Loader fullScreen text="Loading listings…" />
      ) : error && listings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={40} color="#93A08F" />
          <Text className="text-gray-500 dark:text-navy-300 mt-3 text-center">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          renderItem={({ item }) => <ListingCard item={item} />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="gift-outline" size={40} color="#93A08F" />
              <Text className="text-gray-500 dark:text-navy-300 mt-3">Nothing here yet — be the first to share.</Text>
            </View>
          }
        />
      )}

      <Link href="/listings/create" asChild>
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}
