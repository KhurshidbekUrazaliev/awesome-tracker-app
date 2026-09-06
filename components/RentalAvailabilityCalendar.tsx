import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import type { BookedRange } from '@/modules/listings/store/useListingsStore';

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

interface RentalAvailabilityCalendarProps {
  bookedRanges: BookedRange[];
  value: { startDate: string; endDate: string } | null;
  onChange: (range: { startDate: string; endDate: string } | null) => void;
}

export default function RentalAvailabilityCalendar({ bookedRanges, value, onChange }: RentalAvailabilityCalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectionStart, setSelectionStart] = useState<string | null>(null);

  const todayKey = dateKey(new Date());
  const weeks = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isBooked = (key: string) => bookedRanges.some((r) => key >= r.startDate && key <= r.endDate);
  const isPast = (key: string) => key < todayKey;
  const isInSelectedRange = (key: string) => !!value && key >= value.startDate && key <= value.endDate;

  const rangeHasConflict = (start: string, end: string) => bookedRanges.some((r) => start <= r.endDate && end >= r.startDate);

  const handlePress = (key: string) => {
    if (isBooked(key) || isPast(key)) return;

    if (!selectionStart) {
      setSelectionStart(key);
      onChange(null);
      return;
    }

    const [start, end] = key >= selectionStart ? [selectionStart, key] : [key, selectionStart];
    if (rangeHasConflict(start, end)) {
      // Start a fresh selection instead of silently accepting a range that crosses a booked day.
      setSelectionStart(key);
      onChange(null);
      return;
    }
    setSelectionStart(null);
    onChange({ startDate: start, endDate: end });
  };

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
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity onPress={goPrevMonth} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-navy-800 items-center justify-center">
          <Ionicons name="chevron-back" size={16} color="#b8660f" />
        </TouchableOpacity>
        <Text className="text-sm font-bold text-gray-900 dark:text-white">{monthLabel}</Text>
        <TouchableOpacity onPress={goNextMonth} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-navy-800 items-center justify-center">
          <Ionicons name="chevron-forward" size={16} color="#b8660f" />
        </TouchableOpacity>
      </View>

      <View className="flex-row mb-1.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={{ flex: 1 }} className="items-center">
            <Text className="text-xs font-semibold text-gray-400 dark:text-navy-400">{label}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row mb-1">
          {week.map((date, di) => {
            if (!date) return <View key={di} style={{ flex: 1, aspectRatio: 1 }} />;
            const key = dateKey(date);
            const booked = isBooked(key);
            const past = isPast(key);
            const selected = isInSelectedRange(key) || key === selectionStart;
            const disabled = booked || past;
            return (
              <TouchableOpacity
                key={di}
                disabled={disabled}
                style={{ flex: 1, aspectRatio: 1 }}
                className="items-center justify-center"
                onPress={() => handlePress(key)}
              >
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    selected ? 'bg-primary-600 dark:bg-primary-500' : booked ? 'bg-gray-100 dark:bg-navy-800' : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selected
                        ? 'text-white font-bold'
                        : disabled
                        ? 'text-gray-300 dark:text-navy-600 line-through'
                        : 'text-gray-800 dark:text-navy-100'
                    }`}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <Text className="text-xs text-gray-500 dark:text-navy-300 mt-2">
        {selectionStart ? 'Tap an end date' : value ? `${value.startDate} → ${value.endDate}` : 'Tap a start date'}
      </Text>
    </View>
  );
}
