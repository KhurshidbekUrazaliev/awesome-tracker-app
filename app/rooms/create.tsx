import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useRooms } from '@/modules/rooms/hooks/useRooms';
import { ROOM_VISIBILITIES, ROOM_VISIBILITY_LABELS, type RoomVisibility } from '@/modules/rooms/store/useRoomsStore';

const VISIBILITY_HINT: Record<RoomVisibility, string> = {
  private: 'Only you can see this room.',
  shared: "You'll invite specific people by email after creating it.",
  public: 'Anyone can discover and view this room.',
};

export default function CreateRoomScreen() {
  const { createRoom } = useRooms('mine');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<RoomVisibility>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError('Give your room a name.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const room = await createRoom({ name: name.trim(), description: description.trim() || undefined, visibility });
      router.replace(`/rooms/detail?id=${room.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-navy-950">
      <Stack.Screen options={{ title: 'New Room', headerShown: true }} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Travel, Reading List, Wedding Planning" containerClassName="mb-4" />
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="What's this room for?"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 72 }}
          containerClassName="mb-4"
        />

        <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Who can see it?</Text>
        <View className="flex-row flex-wrap mb-2" style={{ gap: 8 }}>
          {ROOM_VISIBILITIES.map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => setVisibility(v)}
              className={`px-4 py-2 rounded-full ${visibility === v ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-100 dark:bg-navy-800'}`}
            >
              <Text className={`text-sm font-medium ${visibility === v ? 'text-white' : 'text-gray-700 dark:text-navy-200'}`}>
                {ROOM_VISIBILITY_LABELS[v]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-xs text-gray-500 dark:text-navy-300 mb-6">{VISIBILITY_HINT[visibility]}</Text>

        {error && <Text className="text-sm text-red-500 mb-4">{error}</Text>}

        <Button title="Create Room" onPress={submit} loading={isSubmitting} fullWidth />
      </ScrollView>
    </View>
  );
}
