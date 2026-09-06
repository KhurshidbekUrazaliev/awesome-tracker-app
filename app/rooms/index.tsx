import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import Avatar from '@/components/Avatar';
import Loader from '@/components/Loader';
import { useRooms } from '@/modules/rooms/hooks/useRooms';
import { ROOM_VISIBILITY_LABELS, type Room } from '@/modules/rooms/store/useRoomsStore';

const VISIBILITY_ICON: Record<Room['visibility'], keyof typeof Ionicons.glyphMap> = {
  private: 'lock-closed-outline',
  shared: 'people-outline',
  public: 'globe-outline',
};

function RoomCard({ room, showOwner }: { room: Room; showOwner: boolean }) {
  return (
    <TouchableOpacity
      className="bg-white dark:bg-navy-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-white/10"
      activeOpacity={0.8}
      onPress={() => router.push(`/rooms/detail?id=${room.id}`)}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
          {room.name}
        </Text>
        <View className="flex-row items-center bg-gray-100 dark:bg-navy-800 px-2 py-1 rounded-full ml-2">
          <Ionicons name={VISIBILITY_ICON[room.visibility]} size={12} color="#93A08F" />
          <Text className="text-xs text-gray-500 dark:text-navy-300 ml-1">{ROOM_VISIBILITY_LABELS[room.visibility]}</Text>
        </View>
      </View>
      {room.description && (
        <Text className="text-sm text-gray-600 dark:text-navy-300" numberOfLines={2}>
          {room.description}
        </Text>
      )}
      {showOwner && room.owner && (
        <View className="flex-row items-center mt-3">
          <Avatar uri={room.owner.avatar} name={room.owner.name} size="sm" />
          <Text className="text-xs text-gray-500 dark:text-navy-300 ml-2">{room.owner.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function RoomsScreen() {
  const [mode, setMode] = useState<'mine' | 'discover'>('mine');
  const { rooms, isLoading, error } = useRooms(mode);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-navy-950">
      <Stack.Screen
        options={{
          title: 'My Space',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/rooms/calendar')} accessibilityLabel="Calendar" style={{ paddingHorizontal: 8 }}>
              <Ionicons name="calendar-outline" size={22} color="#b8660f" />
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-row px-6 pt-4 pb-3 bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-white/10" style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={() => setMode('mine')}
          className={`px-4 py-1.5 rounded-full ${mode === 'mine' ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-100 dark:bg-navy-800'}`}
        >
          <Text className={`text-sm font-medium ${mode === 'mine' ? 'text-white' : 'text-gray-700 dark:text-navy-200'}`}>My Rooms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('discover')}
          className={`px-4 py-1.5 rounded-full ${mode === 'discover' ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-100 dark:bg-navy-800'}`}
        >
          <Text className={`text-sm font-medium ${mode === 'discover' ? 'text-white' : 'text-gray-700 dark:text-navy-200'}`}>Discover</Text>
        </TouchableOpacity>
      </View>

      {isLoading && rooms.length === 0 ? (
        <Loader fullScreen text="Loading rooms…" />
      ) : error && rooms.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={40} color="#93A08F" />
          <Text className="text-gray-500 dark:text-navy-300 mt-3 text-center">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          renderItem={({ item }) => <RoomCard room={item} showOwner={mode === 'discover'} />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="albums-outline" size={40} color="#93A08F" />
              <Text className="text-gray-500 dark:text-navy-300 mt-3">
                {mode === 'mine' ? "You haven't made a room yet." : 'No public rooms yet.'}
              </Text>
            </View>
          }
        />
      )}

      {mode === 'mine' && (
        <Link href="/rooms/create" asChild>
          <TouchableOpacity
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 items-center justify-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}
