import React from 'react';
import { View, Text, Switch } from 'react-native';

interface NotificationToggleProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function NotificationToggle({
  title,
  description,
  value,
  onValueChange,
}: NotificationToggleProps) {
  return (
    <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
      <View className="flex-1 pr-4">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {description && (
          <Text className="text-sm text-gray-500 mt-1">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
        thumbColor={value ? '#0284c7' : '#F3F4F6'}
      />
    </View>
  );
}
