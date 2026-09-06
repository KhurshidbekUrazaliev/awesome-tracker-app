import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import uploadService from '@/services/uploadService';

interface MultiPhotoPickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

/** A row of uploaded photo thumbnails (tap to remove) plus an "add" tile, up to `max`. */
export default function MultiPhotoPicker({ value, onChange, max = 5 }: MultiPhotoPickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPhoto = async () => {
    try {
      setIsUploading(true);
      setError(null);
      const asset = await uploadService.pickImage();
      if (!asset) return;
      const { url } = await uploadService.uploadFile(asset.uri);
      onChange([...value, url]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmRemove = (index: number) => {
    Alert.alert('Remove photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onChange(value.filter((_, i) => i !== index)) },
    ]);
  };

  return (
    <View>
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {value.map((url, i) => (
          <TouchableOpacity key={url + i} onPress={() => confirmRemove(i)}>
            <Image source={{ uri: url }} style={{ width: 88, height: 88, borderRadius: 12 }} />
            <View className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
              <Ionicons name="close" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        ))}
        {value.length < max && (
          <TouchableOpacity
            onPress={pickPhoto}
            disabled={isUploading}
            className="rounded-xl bg-gray-100 dark:bg-navy-800 items-center justify-center"
            style={{ width: 88, height: 88 }}
          >
            <Ionicons name={isUploading ? 'hourglass-outline' : 'camera-outline'} size={22} color="#93A08F" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-xs text-red-500 mt-2">{error}</Text>}
    </View>
  );
}
