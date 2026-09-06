import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import Button from '@/components/Button';
import DateTimeField from '@/components/DateTimeField';
import Input from '@/components/Input';
import LocationField from '@/components/LocationField';
import MultiPhotoPicker from '@/components/MultiPhotoPicker';
import { useListings } from '@/modules/listings/hooks/useListings';
import { LISTING_TYPE_LABELS, LISTING_TYPES, type ListingType } from '@/modules/listings/store/useListingsStore';
import type { GeoPlace } from '@/services/geoService';
import { useUserStore } from '@/store/useUserStore';

// The 5 types that involve an in-person handoff -- these need a resolved
// location before they can accept requests/bookings/bids (see server-side
// checkTransactionDistance in routes/listings.ts). idea/lesson are exempt.
const PHYSICAL_TYPES: ListingType[] = ['give_away', 'exchange', 'trial', 'rental', 'auction'];

/** "$12.50" or "12.5" -> 1250 cents. Returns null for empty/invalid input. */
function dollarsToCents(value: string): number | null {
  const parsed = parseFloat(value);
  if (!value.trim() || Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export default function CreateListingScreen() {
  const { createListing } = useListings();
  const { user } = useUserStore();
  const [type, setType] = useState<ListingType>('idea');
  const [location, setLocation] = useState<GeoPlace | null>(
    user?.location?.lat != null && user?.location?.lng != null
      ? {
          lat: user.location.lat,
          lng: user.location.lng,
          city: user.location.city,
          region: user.location.region,
          country: user.location.country,
          countryCode: user.location.countryCode,
        }
      : null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [wantInReturn, setWantInReturn] = useState('');
  const [trialDays, setTrialDays] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [deposit, setDeposit] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [auctionEndsAt, setAuctionEndsAt] = useState<Date | null>(null);
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
    const pricePerDayCents = dollarsToCents(pricePerDay);
    if (type === 'rental' && (!pricePerDayCents || pricePerDayCents < 50)) {
      setError('Enter a price per day of at least $0.50.');
      return;
    }
    const depositAmountCents = deposit.trim() ? dollarsToCents(deposit) : 0;
    if (type === 'rental' && depositAmountCents === null) {
      setError('Enter a valid deposit amount, or leave it blank.');
      return;
    }
    const startingBidCents = dollarsToCents(startingBid);
    if (type === 'auction' && (!startingBidCents || startingBidCents < 50)) {
      setError('Enter a starting bid of at least $0.50.');
      return;
    }
    if (type === 'auction' && (!auctionEndsAt || auctionEndsAt <= new Date())) {
      setError('Pick an auction deadline in the future.');
      return;
    }
    if (PHYSICAL_TYPES.includes(type) && !location) {
      setError('Set a location for this listing — use your current location or search for a city.');
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
        pricePerDayCents: type === 'rental' ? pricePerDayCents! : undefined,
        depositAmountCents: type === 'rental' && depositAmountCents ? depositAmountCents : undefined,
        startingBidCents: type === 'auction' ? startingBidCents! : undefined,
        auctionEndsAt: type === 'auction' ? auctionEndsAt!.toISOString() : undefined,
        locationLat: location?.lat,
        locationLng: location?.lng,
        locationCity: location?.city,
        locationRegion: location?.region,
        locationCountry: location?.country,
        locationCountryCode: location?.countryCode,
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

        {type === 'rental' && (
          <>
            <Input
              label="Price per day"
              value={pricePerDay}
              onChangeText={(v) => setPricePerDay(v.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 15.00"
              keyboardType="decimal-pad"
              leftIcon={<Text className="text-gray-500 dark:text-navy-300">$</Text>}
              containerClassName="mb-4"
            />
            <Input
              label="Refundable deposit (optional)"
              value={deposit}
              onChangeText={(v) => setDeposit(v.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 50.00"
              keyboardType="decimal-pad"
              leftIcon={<Text className="text-gray-500 dark:text-navy-300">$</Text>}
              containerClassName="mb-4"
            />
          </>
        )}

        {type === 'auction' && (
          <>
            <Input
              label="Starting bid"
              value={startingBid}
              onChangeText={(v) => setStartingBid(v.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 10.00"
              keyboardType="decimal-pad"
              leftIcon={<Text className="text-gray-500 dark:text-navy-300">$</Text>}
              containerClassName="mb-4"
            />
            <DateTimeField
              label="Auction ends"
              value={auctionEndsAt}
              onChange={setAuctionEndsAt}
              minimumDate={new Date()}
              containerClassName="mb-4"
            />
          </>
        )}

        {PHYSICAL_TYPES.includes(type) && (
          <LocationField label="Where is this item?" value={location} onChange={setLocation} containerClassName="mb-4" />
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
