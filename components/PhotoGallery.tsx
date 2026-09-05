import React from 'react';
import { Image, ScrollView, View } from 'react-native';

/** A single full-width photo, or a horizontally-scrolling filmstrip when there's more than one. */
export default function PhotoGallery({ photos, height = 220 }: { photos: string[]; height?: number }) {
  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return <Image source={{ uri: photos[0] }} style={{ width: '100%', height, borderRadius: 16 }} resizeMode="cover" />;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {photos.map((uri, i) => (
          <Image key={uri + i} source={{ uri }} style={{ width: height * 1.3, height, borderRadius: 16 }} resizeMode="cover" />
        ))}
      </View>
    </ScrollView>
  );
}
