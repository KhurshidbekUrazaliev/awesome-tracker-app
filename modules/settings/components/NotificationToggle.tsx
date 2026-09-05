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
    <View className="flex-row justify-between items-center py-4 border-b border-gray-200 dark:border-navy-700">
      <View className="flex-1 pr-4">
        <Text className="text-base font-medium text-gray-900 dark:text-white">{title}</Text>
        {description && (
          <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#c4b5fd' }}
        thumbColor={value ? '#7c3aed' : '#F3F4F6'}
      />
    </View>
  );
}
