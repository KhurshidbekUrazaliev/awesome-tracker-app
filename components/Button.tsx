import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseClasses = 'rounded-lg items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    outline: 'border-2 border-primary-600 bg-transparent',
    danger: 'bg-red-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-600',
    danger: 'text-white',
  };

  const disabledClass = disabled || loading ? 'opacity-50' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClass} ${widthClass}`}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#0284c7' : '#ffffff'} />
      ) : (
        <Text className={`font-semibold ${textSizeClasses[size]} ${textColorClasses[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
