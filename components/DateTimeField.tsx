import { Platform, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

interface DateTimeFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  containerClassName?: string;
}

function formatValue(value: Date | null): string {
  if (!value) return 'Select date & time';
  return `${value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${value.toLocaleTimeString(
    'en-US',
    { hour: '2-digit', minute: '2-digit' }
  )}`;
}

/** Combines the date parts of `date` with the time parts of `time` into one Date. */
function combine(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

export default function DateTimeField({ label, value, onChange, minimumDate, containerClassName }: DateTimeFieldProps) {
  const [iosStep, setIosStep] = useState<'closed' | 'date' | 'time'>('closed');
  const [iosDraftDate, setIosDraftDate] = useState<Date | null>(null);

  const openAndroid = () => {
    const base = value ?? new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      minimumDate,
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: base,
          mode: 'time',
          onChange: (timeEvent, pickedTime) => {
            if (timeEvent.type !== 'set' || !pickedTime) return;
            onChange(combine(pickedDate, pickedTime));
          },
        });
      },
    });
  };

  const openIOS = () => {
    setIosDraftDate(value ?? new Date());
    setIosStep('date');
  };

  const open = () => (Platform.OS === 'android' ? openAndroid() : openIOS());

  return (
    <View className={containerClassName}>
      {label && <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">{label}</Text>}
      <TouchableOpacity
        onPress={open}
        className="flex-row items-center justify-between border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-3 bg-white dark:bg-navy-800"
      >
        <Text className={value ? 'text-base text-gray-900 dark:text-white' : 'text-base text-gray-400 dark:text-navy-400'}>
          {formatValue(value)}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && iosStep !== 'closed' && iosDraftDate && (
        <RNDateTimePicker
          value={iosDraftDate}
          mode={iosStep}
          display="default"
          minimumDate={iosStep === 'date' ? minimumDate : undefined}
          onChange={(event, picked) => {
            if (event.type !== 'set' || !picked) {
              setIosStep('closed');
              return;
            }
            if (iosStep === 'date') {
              setIosDraftDate(picked);
              setIosStep('time');
            } else {
              const finalDate = combine(iosDraftDate, picked);
              setIosStep('closed');
              onChange(finalDate);
            }
          }}
        />
      )}
    </View>
  );
}
