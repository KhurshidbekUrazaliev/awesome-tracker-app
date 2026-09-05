import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import Input from '@/components/Input';
import MultiPhotoPicker from '@/components/MultiPhotoPicker';
import { useListings } from '@/modules/listings/hooks/useListings';
import { LISTING_TYPE_LABELS, LISTING_TYPES, type ListingType } from '@/modules/listings/store/useListingsStore';

export default function CreateListingScreen() {
  const { createListing } = useListings();
  const [type, setType] = useState<ListingType>('idea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [wantInReturn, setWantInReturn] = useState('');
  const [trialDays, setTrialDays] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !description.trim() || !category.trim()) {
      setError('Title, description, and category are required.');
      return;
    }
    const parsedTrialDays = parseInt(trialDays, 10);
    if (type === 'trial' && (!trialDays || Number.isNaN(parsedTrialDays) || parsedTrialDays < 1)) {
      setError('Enter how many days someone can try this for.');
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
        media: mediaUrls,
        wantInReturn: type === 'exchange' ? wantInReturn.trim() || undefined : undefined,
        trialDays: type === 'trial' ? parsedTrialDays : undefined,
      });
      router.replace(`/listings/detail?id=${listing.id}`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create listing';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
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

        {type === 'trial' && (
          <Input
            label="How many days can someone try it?"
            value={trialDays}
            onChangeText={(v) => setTrialDays(v.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 7"
            keyboardType="number-pad"
            containerClassName="mb-4"
          />
        )}

        <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Photos (optional, up to 5)</Text>
        <View className="mb-4">
          <MultiPhotoPicker value={mediaUrls} onChange={setMediaUrls} max={5} />
        </View>

        {error && <Text className="text-sm text-red-500 mb-4">{error}</Text>}

        <Button title="Post Listing" onPress={submit} loading={isSubmitting} fullWidth />
      </ScrollView>
    </View>
  );
}
