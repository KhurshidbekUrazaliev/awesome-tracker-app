import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Avatar from '@/components/Avatar';

interface AvatarUploadProps {
  uri?: string;
  name: string;
  onPress: () => void;
  loading?: boolean;
}

export default function AvatarUpload({ uri, name, onPress, loading }: AvatarUploadProps) {
  return (
    <View className="items-center">
      <TouchableOpacity onPress={onPress} disabled={loading}>
        <Avatar uri={uri} name={name} size="xl" />
        <View className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2">
          <Text className="text-white text-xs">📷</Text>
        </View>
      </TouchableOpacity>
      <Text className="text-sm text-primary-600 mt-2">Change Photo</Text>
    </View>
  );
}
