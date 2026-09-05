import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import DateTimeField from '@/components/DateTimeField';
import Input from '@/components/Input';
import MultiPhotoPicker from '@/components/MultiPhotoPicker';
import { useRoomDetail } from '@/modules/rooms/hooks/useRoomDetail';
import { ROOM_ITEM_TYPE_LABELS, ROOM_ITEM_TYPES, type ChecklistEntry, type RoomItemType } from '@/modules/rooms/store/useRoomsStore';

export default function AddRoomItemScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { createItem } = useRoomDetail(roomId);

  const [type, setType] = useState<RoomItemType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [checklist, setChecklist] = useState<ChecklistEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChecklistEntry = () => {
    if (!checklistDraft.trim()) return;
    setChecklist((prev) => [...prev, { text: checklistDraft.trim(), done: false }]);
    setChecklistDraft('');
  };

  const removeChecklistEntry = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!title.trim()) {
      setError('Give it a title.');
      return;
    }
    if (type === 'link' && !url.trim()) {
      setError('A link needs a URL.');
      return;
    }
    if ((type === 'reminder' || type === 'event') && !dueAt) {
      setError('When should this happen?');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createItem({
        type,
        title: title.trim(),
        content: content.trim() || undefined,
        url: type === 'link' ? url.trim() : undefined,
        media: type === 'moment' && mediaUrls.length > 0 ? mediaUrls : undefined,
        dueAt: dueAt ? dueAt.toISOString() : undefined,
        checklist: type === 'plan' && checklist.length > 0 ? checklist : undefined,
      });
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-navy-950">
      <Stack.Screen options={{ title: 'Add to Room', headerShown: true }} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Type</Text>
        <View className="flex-row flex-wrap mb-5" style={{ gap: 8 }}>
          {ROOM_ITEM_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              className={`px-4 py-2 rounded-full ${type === t ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-100 dark:bg-navy-800'}`}
            >
              <Text className={`text-sm font-medium ${type === t ? 'text-white' : 'text-gray-700 dark:text-navy-200'}`}>
                {ROOM_ITEM_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Give it a title" containerClassName="mb-4" />
        <Input
          label="Details (optional)"
          value={content}
          onChangeText={setContent}
          placeholder="Add more detail"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 72 }}
          containerClassName="mb-4"
        />

        {type === 'link' && (
          <Input label="URL" value={url} onChangeText={setUrl} placeholder="https://…" autoCapitalize="none" containerClassName="mb-4" />
        )}

        {(type === 'reminder' || type === 'event') && (
          <DateTimeField label="When" value={dueAt} onChange={setDueAt} minimumDate={new Date()} containerClassName="mb-4" />
        )}

        {type === 'moment' && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Photos (up to 5)</Text>
            <MultiPhotoPicker value={mediaUrls} onChange={setMediaUrls} max={5} />
          </View>
        )}

        {type === 'plan' && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Checklist (optional)</Text>
            {checklist.map((entry, i) => (
              <View key={i} className="flex-row items-center justify-between bg-gray-50 dark:bg-navy-900 rounded-lg px-3 py-2 mb-2">
                <Text className="text-sm text-gray-800 dark:text-navy-100 flex-1">{entry.text}</Text>
                <TouchableOpacity onPress={() => removeChecklistEntry(i)}>
                  <Ionicons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
            <View className="flex-row" style={{ gap: 8 }}>
              <TextInput
                value={checklistDraft}
                onChangeText={setChecklistDraft}
                onSubmitEditing={addChecklistEntry}
                placeholder="Add a step"
                placeholderTextColor="#9CA3AF"
                className="flex-1 border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
              />
              <Button title="Add" size="sm" onPress={addChecklistEntry} />
            </View>
          </View>
        )}

        {error && <Text className="text-sm text-red-500 mb-4">{error}</Text>}

        <Button title="Add to Room" onPress={submit} loading={isSubmitting} fullWidth />
      </ScrollView>
    </View>
  );
}
