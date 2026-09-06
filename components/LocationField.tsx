import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import geoService, { type GeoPlace } from '@/services/geoService';
import Button from './Button';

interface LocationFieldProps {
  label?: string;
  value: GeoPlace | null;
  onChange: (place: GeoPlace) => void;
  containerClassName?: string;
}

function formatPlace(place: GeoPlace | null): string {
  if (!place) return 'Not set';
  const parts = [place.city, place.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : `${place.lat.toFixed(2)}, ${place.lng.toFixed(2)}`;
}

export default function LocationField({ label, value, onChange, containerClassName }: LocationFieldProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GeoPlace[]>([]);

  const useCurrentLocation = async () => {
    try {
      setIsLocating(true);
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied — search for a city below instead.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const place = await geoService.reverseGeocode(position.coords.latitude, position.coords.longitude);
      onChange(place);
    } catch {
      setError('Failed to get your location — search for a city below instead.');
    } finally {
      setIsLocating(false);
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    try {
      setIsSearching(true);
      setError(null);
      setResults(await geoService.searchPlaces(query.trim()));
    } catch {
      setError('Search failed — try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View className={containerClassName}>
      {label && <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">{label}</Text>}
      <View className="flex-row items-center justify-between border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-3 bg-white dark:bg-navy-800 mb-2">
        <Text className="text-base text-gray-900 dark:text-white">{formatPlace(value)}</Text>
        {isLocating && <ActivityIndicator size="small" />}
      </View>

      <Button title="Use my current location" variant="outline" size="sm" onPress={useCurrentLocation} loading={isLocating} />

      <View className="flex-row items-center mt-3" style={{ gap: 8 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Or type a city"
          placeholderTextColor="#9CA3AF"
          className="flex-1 border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
          onSubmitEditing={search}
        />
        <Button title="Search" size="sm" variant="secondary" onPress={search} loading={isSearching} disabled={!query.trim()} />
      </View>

      {results.length > 0 && (
        <View className="mt-2 border border-gray-200 dark:border-navy-700 rounded-lg overflow-hidden">
          {results.map((place, i) => (
            <TouchableOpacity
              key={`${place.lat},${place.lng}`}
              onPress={() => {
                onChange(place);
                setResults([]);
                setQuery('');
              }}
              className={`px-3 py-2 ${i > 0 ? 'border-t border-gray-100 dark:border-navy-800' : ''}`}
            >
              <Text className="text-sm text-gray-800 dark:text-navy-100">{formatPlace(place)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && <Text className="text-xs text-red-500 mt-2">{error}</Text>}
      <Text className="text-xs text-gray-400 dark:text-navy-500 mt-2">Location data © OpenStreetMap contributors</Text>
    </View>
  );
}
