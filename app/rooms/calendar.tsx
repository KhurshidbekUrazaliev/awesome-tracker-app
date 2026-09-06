import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import Loader from '@/components/Loader';
import { useRoomsCalendar } from '@/modules/rooms/hooks/useRoomsCalendar';
import type { CalendarItem } from '@/modules/rooms/store/useRoomsStore';
import { formatDate } from '@/utils/formatDate';

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parses a "YYYY-MM-DD" key back into a local-time Date — new Date(key) would parse as UTC and can land on the wrong day. */
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function buildMonthGrid(viewDate: Date): (Date | null)[][] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function RoomsCalendarScreen() {
  const { items, isLoading, error } = useRoomsCalendar();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedKey, setSelectedKey] = useState(() => dateKey(new Date()));

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    for (const item of items) {
      if (!item.dueAt) continue;
      const key = dateKey(new Date(item.dueAt));
      (map[key] ||= []).push(item);
    }
    return map;
  }, [items]);

  const weeks = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const todayKey = dateKey(new Date());
  const selectedItems = itemsByDate[selectedKey] || [];
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrevMonth = () =>
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  const goNextMonth = () =>
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });

  return (
    <View className="flex-1 bg-gray-50 dark:bg-navy-950">
      <Stack.Screen options={{ title: 'Calendar', headerShown: true }} />

      {isLoading && items.length === 0 ? (
        <Loader fullScreen text="Loading calendar…" />
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={40} color="#93A08F" />
          <Text className="text-gray-500 dark:text-navy-300 mt-3 text-center">{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={goPrevMonth}
              className="w-9 h-9 rounded-full bg-white dark:bg-navy-800 items-center justify-center"
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={18} color="#b8660f" />
            </TouchableOpacity>
            <Text className="text-base font-bold text-gray-900 dark:text-white">{monthLabel}</Text>
            <TouchableOpacity
              onPress={goNextMonth}
              className="w-9 h-9 rounded-full bg-white dark:bg-navy-800 items-center justify-center"
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={18} color="#b8660f" />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-2">
            {WEEKDAY_LABELS.map((label, i) => (
              <View key={i} style={{ flex: 1 }} className="items-center">
                <Text className="text-xs font-semibold text-gray-400 dark:text-navy-400">{label}</Text>
              </View>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} className="flex-row mb-1.5">
              {week.map((date, di) => {
                if (!date) return <View key={di} style={{ flex: 1, aspectRatio: 1 }} />;
                const key = dateKey(date);
                const hasItems = !!itemsByDate[key]?.length;
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;
                return (
                  <TouchableOpacity
                    key={di}
                    style={{ flex: 1, aspectRatio: 1 }}
                    className="items-center justify-center"
                    onPress={() => setSelectedKey(key)}
                  >
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        isSelected ? 'bg-primary-600 dark:bg-primary-500' : isToday ? 'border border-primary-500' : ''
                      }`}
                    >
                      <Text className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-gray-800 dark:text-navy-100'}`}>
                        {date.getDate()}
                      </Text>
                    </View>
                    {hasItems && !isSelected && <View className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-0.5" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View className="mt-6">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
              {parseDateKey(selectedKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            {selectedItems.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-navy-300">Nothing on this day.</Text>
            ) : (
              selectedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="bg-white dark:bg-navy-900 rounded-xl p-4 mb-2 border border-gray-100 dark:border-white/10 flex-row items-center"
                  onPress={() => router.push(`/rooms/detail?id=${item.roomId}`)}
                >
                  <Ionicons name={item.type === 'event' ? 'calendar-outline' : 'alarm-outline'} size={18} color="#b8660f" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</Text>
                    <Text className="text-xs text-gray-500 dark:text-navy-300">
                      {item.roomName} · {formatDate(item.dueAt!, 'time')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
