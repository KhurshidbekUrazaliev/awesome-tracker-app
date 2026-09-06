import React from 'react';
import { View } from 'react-native';
import Text from '@/components/Text';

interface DateTimeFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  containerClassName?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toInputValue(value: Date | null | undefined): string | undefined {
  if (!value) return undefined;
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default function DateTimeField({ label, value, onChange, minimumDate, containerClassName }: DateTimeFieldProps) {
  return (
    <View className={containerClassName}>
      {label && <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">{label}</Text>}
      <input
        type="datetime-local"
        value={toInputValue(value) ?? ''}
        min={toInputValue(minimumDate)}
        onChange={(e) => {
          if (!e.target.value) return;
          onChange(new Date(e.target.value));
        }}
        className="w-full rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-800 px-3 py-3 text-base text-gray-900 dark:text-white"
      />
    </View>
  );
}
