import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Button from '@/components/Button';
import LocationField from '@/components/LocationField';
import type { GeoPlace } from '@/services/geoService';
import { useProfile } from '@/modules/profile/hooks/useProfile';

export default function LocationSettingsScreen() {
  const { user, updateProfile, isLoading } = useProfile();
  const initial: GeoPlace | null =
    user?.location?.lat != null && user?.location?.lng != null
      ? {
          lat: user.location.lat,
          lng: user.location.lng,
          city: user.location.city,
          region: user.location.region,
          country: user.location.country,
          countryCode: user.location.countryCode,
        }
      : null;

  const [place, setPlace] = useState<GeoPlace | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!place) return;
    try {
      setError(null);
      setSaved(false);
      await updateProfile({
        locationLat: place.lat,
        locationLng: place.lng,
        locationCity: place.city,
        locationRegion: place.region,
        locationCountry: place.country,
        locationCountryCode: place.countryCode,
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Location', headerShown: true }} />
      <ScrollView className="flex-1 bg-white dark:bg-navy-950">
        <View className="px-6 py-4">
          <Text className="text-sm text-gray-500 dark:text-navy-300 mb-4">
            Set your location so listings you post default to it, and so give-aways, exchanges, trials, rentals, and
            auctions can check that an in-person handoff is realistic before a request goes through.
          </Text>

          <LocationField value={place} onChange={setPlace} containerClassName="mb-4" />

          {error && <Text className="text-sm text-red-500 mb-3">{error}</Text>}
          {saved && !error && <Text className="text-sm text-green-600 dark:text-green-400 mb-3">Saved!</Text>}

          <Button title="Save Location" onPress={save} loading={isLoading} disabled={!place} fullWidth />
        </View>
      </ScrollView>
    </>
  );
}
