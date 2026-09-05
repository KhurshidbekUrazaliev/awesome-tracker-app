import React from 'react';
import { View, Image, Text, ViewProps } from 'react-native';

interface AvatarProps extends ViewProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: boolean;
}

export default function Avatar({ 
  uri, 
  name = '', 
  size = 'md', 
  rounded = true,
  style,
  ...props 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';
  
  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View
      className={`${sizeClasses[size]} ${roundedClass} items-center justify-center overflow-hidden bg-primary-200 dark:bg-navy-700`}
      style={style}
      {...props}
    >
      {uri ? (
        <Image
          source={{ uri }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text className={`${textSizeClasses[size]} font-semibold text-primary-700 dark:text-primary-200`}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
