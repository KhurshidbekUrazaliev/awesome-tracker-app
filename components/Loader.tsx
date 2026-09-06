import { useColorScheme } from 'nativewind';
import React from 'react';
import { View, ActivityIndicator, ViewProps } from 'react-native';
import Text from '@/components/Text';

interface LoaderProps extends ViewProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({
  size = 'large',
  color,
  text,
  fullScreen = false,
  style,
  ...props
}: LoaderProps) {
  const { colorScheme } = useColorScheme();
  const spinnerColor = color ?? (colorScheme === 'dark' ? '#e0a252' : '#b8660f');

  const content = (
    <>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && <Text className="text-base text-gray-600 dark:text-navy-300 mt-3">{text}</Text>}
    </>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-navy-950" {...props}>
        {content}
      </View>
    );
  }

  return (
    <View className="justify-center items-center p-4" style={style} {...props}>
      {content}
    </View>
  );
}
