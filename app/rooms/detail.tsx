import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import PhotoGallery from '@/components/PhotoGallery';
import { useRoomDetail } from '@/modules/rooms/hooks/useRoomDetail';
import roomsService from '@/modules/rooms/services/roomsService';
import { ROOM_VISIBILITY_LABELS, type RoomItem } from '@/modules/rooms/store/useRoomsStore';
import { formatDate } from '@/utils/formatDate';

const ITEM_ICON: Record<RoomItem['type'], keyof typeof Ionicons.glyphMap> = {
  note: 'document-text-outline',
  link: 'link-outline',
  reminder: 'alarm-outline',
  event: 'calendar-outline',
  wish: 'heart-outline',
  moment: 'image-outline',
  plan: 'checkbox-outline',
};

function ItemCard({
  item,
  isOwner,
  onToggleChecklist,
  onDelete,
}: {
  item: RoomItem;
  isOwner: boolean;
  onToggleChecklist: (index: number) => void;
  onDelete: () => void;
}) {
  return (
    <View className="bg-white dark:bg-navy-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-white/10">
      <View className="flex-row items-start justify-between mb-1">
        <View className="flex-row items-center flex-1">
          <Ionicons name={ITEM_ICON[item.type]} size={16} color="#b8660f" />
          <Text className="text-base font-bold text-gray-900 dark:text-white ml-2 flex-1" numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={onDelete} accessibilityLabel="Delete item">
            <Ionicons name="trash-outline" size={16} color="#93A08F" />
          </TouchableOpacity>
        )}
      </View>

      {item.content && <Text className="text-sm text-gray-600 dark:text-navy-300 mb-2">{item.content}</Text>}

      {item.type === 'link' && item.url && (
        <TouchableOpacity onPress={() => Linking.openURL(item.url!)}>
          <Text className="text-sm text-primary-600 dark:text-primary-400" numberOfLines={1}>
            {item.url}
          </Text>
        </TouchableOpacity>
      )}

      {(item.type === 'reminder' || item.type === 'event') && item.dueAt && (
        <Text className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          {formatDate(item.dueAt, 'long')}
        </Text>
      )}

      {item.media.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <PhotoGallery photos={item.media} height={160} />
        </View>
      )}

      {item.type === 'plan' && item.checklist && item.checklist.length > 0 && (
        <View className="mt-2">
          {item.checklist.map((entry, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => isOwner && onToggleChecklist(i)}
              disabled={!isOwner}
              className="flex-row items-center py-1.5"
            >
              <Ionicons name={entry.done ? 'checkbox' : 'square-outline'} size={18} color={entry.done ? '#b8660f' : '#93A08F'} />
              <Text
                className={`text-sm ml-2 ${entry.done ? 'text-gray-400 dark:text-navy-400 line-through' : 'text-gray-800 dark:text-navy-100'}`}
              >
                {entry.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { room, isOwner, items, isLoading, error, toggleChecklistEntry, deleteItem } = useRoomDetail(id);
  const [memberEmail, setMemberEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  if (isLoading && !room) return <Loader fullScreen text="Loading…" />;
  if (error || !room) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-navy-950 px-6">
        <Stack.Screen options={{ title: 'Room', headerShown: true }} />
        <Text className="text-gray-500 dark:text-navy-300 text-center">{error || 'Room not found'}</Text>
      </View>
    );
  }

  const confirmDelete = (itemId: string) => {
    Alert.alert('Delete this item?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteItem(itemId) },
    ]);
  };

  const invite = async () => {
    if (!memberEmail.trim()) return;
    try {
      setInviting(true);
      setInviteError(null);
      await roomsService.addMember(room.id, memberEmail.trim());
      setMemberEmail('');
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-navy-950">
      <Stack.Screen options={{ title: room.name, headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-extrabold text-gray-900 dark:text-white flex-1">{room.name}</Text>
          <View className="bg-gray-100 dark:bg-navy-800 px-2.5 py-1 rounded-full ml-2">
            <Text className="text-xs text-gray-600 dark:text-navy-300">{ROOM_VISIBILITY_LABELS[room.visibility]}</Text>
          </View>
        </View>
        {room.description && <Text className="text-sm text-gray-600 dark:text-navy-300 mb-4">{room.description}</Text>}

        {isOwner && room.visibility === 'shared' && (
          <View className="bg-white dark:bg-navy-900 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-white/10">
            <Text className="text-sm font-bold text-gray-900 dark:text-white mb-2">Invite by email</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <TextInput
                value={memberEmail}
                onChangeText={setMemberEmail}
                placeholder="person@example.com"
                placeholderTextColor="#93A08F"
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
              />
              <Button title="Invite" size="sm" onPress={invite} loading={inviting} />
            </View>
            {inviteError && <Text className="text-xs text-red-500 mt-2">{inviteError}</Text>}
          </View>
        )}

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-gray-900 dark:text-white">Items</Text>
          {isOwner && (
            <Link href={`/rooms/add-item?roomId=${room.id}`} asChild>
              <TouchableOpacity className="flex-row items-center bg-primary-600 dark:bg-primary-500 px-3 py-1.5 rounded-full">
                <Ionicons name="add" size={16} color="#fff" />
                <Text className="text-xs font-semibold text-white ml-1">Add</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>

        {items.length === 0 ? (
          <Text className="text-sm text-gray-500 dark:text-navy-300">Nothing in this room yet.</Text>
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onToggleChecklist={(index) => toggleChecklistEntry(item, index)}
              onDelete={() => confirmDelete(item.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
