import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerClassName,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const borderColor = error
    ? 'border-red-500'
    : isFocused
    ? 'border-primary-600 dark:border-primary-400'
    : 'border-gray-300 dark:border-navy-600';

  return (
    <View className={containerClassName}>
      {label && <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">{label}</Text>}

      <View className={`flex-row items-center border ${borderColor} rounded-lg px-3 bg-white dark:bg-navy-800`}>
        {leftIcon && <View className="mr-2">{leftIcon}</View>}

        <TextInput
          className="flex-1 py-3 text-base text-gray-900 dark:text-white"
          placeholderTextColor="#9CA3AF"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} className="ml-2">
            <Text className="text-primary-600 dark:text-primary-400">{isSecure ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && <View className="ml-2">{rightIcon}</View>}
      </View>

      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
      {hint && !error && <Text className="text-xs text-gray-500 dark:text-navy-300 mt-1">{hint}</Text>}
    </View>
  );
}
