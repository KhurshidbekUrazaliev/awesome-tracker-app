import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useListings } from '@/modules/listings/hooks/useListings';
import { LISTING_TYPE_LABELS, LISTING_TYPES, type ListingType } from '@/modules/listings/store/useListingsStore';
import uploadService from '@/services/uploadService';

export default function CreateListingScreen() {
  const { createListing } = useListings();
  const [type, setType] = useState<ListingType>('idea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [wantInReturn, setWantInReturn] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPhoto = async () => {
    try {
      setIsUploading(true);
      setError(null);
      const asset = await uploadService.pickImage();
      if (!asset) return;
      const { url } = await uploadService.uploadFile(asset.uri);
      setMediaUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !description.trim() || !category.trim()) {
      setError('Title, description, and category are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const listing = await createListing({
        type,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        media: mediaUrl ? [mediaUrl] : [],
        wantInReturn: type === 'exchange' ? wantInReturn.trim() || undefined : undefined,
      });
      router.replace(`/listings/detail?id=${listing.id}`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create listing';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDiscardPhoto = () => {
    Alert.alert('Remove photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setMediaUrl(null) },
    ]);
  };

  return (
    <View className="flex-1 bg-white dark:bg-navy-950">
      <Stack.Screen options={{ title: 'New Listing', headerShown: true }} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Type</Text>
        <View className="flex-row flex-wrap mb-5" style={{ gap: 8 }}>
          {LISTING_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              className={`px-4 py-2 rounded-full ${
                type === t ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-100 dark:bg-navy-800'
              }`}
            >
              <Text className={`text-sm font-medium ${type === t ? 'text-white' : 'text-gray-700 dark:text-navy-200'}`}>
                {LISTING_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder="What are you sharing?" containerClassName="mb-4" />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell people more about it"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 96 }}
          containerClassName="mb-4"
        />
        <Input label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Books, Cooking, Electronics" containerClassName="mb-4" />
        <Input
          label="Tags (optional)"
          value={tags}
          onChangeText={setTags}
          placeholder="comma, separated, tags"
          containerClassName="mb-4"
        />

        {type === 'exchange' && (
          <Input
            label="What would you like in return?"
            value={wantInReturn}
            onChangeText={setWantInReturn}
            placeholder="e.g. A guitar lesson, or a good book"
            containerClassName="mb-4"
          />
        )}

        <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Photo (optional)</Text>
        {mediaUrl ? (
          <TouchableOpacity onPress={confirmDiscardPhoto} className="mb-4">
            <Image source={{ uri: mediaUrl }} style={{ width: 120, height: 120, borderRadius: 12 }} />
            <View className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
              <Ionicons name="close" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={pickPhoto}
            disabled={isUploading}
            className="w-28 h-28 rounded-xl bg-gray-100 dark:bg-navy-800 items-center justify-center mb-4"
          >
            <Ionicons name={isUploading ? 'hourglass-outline' : 'camera-outline'} size={26} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {error && <Text className="text-sm text-red-500 mb-4">{error}</Text>}

        <Button title="Post Listing" onPress={submit} loading={isSubmitting} fullWidth />
      </ScrollView>
    </View>
  );
}
