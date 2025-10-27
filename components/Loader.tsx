import React from 'react';
import { View, ActivityIndicator, Text, ViewProps } from 'react-native';

interface LoaderProps extends ViewProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({
  size = 'large',
  color = '#0284c7',
  text,
  fullScreen = false,
  style,
  ...props
}: LoaderProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {text && <Text className="text-base text-gray-600 mt-3">{text}</Text>}
    </>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 justify-center items-center bg-white" {...props}>
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
