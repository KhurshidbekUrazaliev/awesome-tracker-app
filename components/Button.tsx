import { useColorScheme } from 'nativewind';
import React from 'react';
import { TouchableOpacity, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import Text from '@/components/Text';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

// forwardRef so `<Link asChild>` can attach its merged href/onClick props directly
// to this component's underlying element — without it, Link falls back to a plain
// browser navigation on web instead of client-side routing.
const Button = React.forwardRef<View, ButtonProps>(function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}, ref) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseClasses = 'rounded-lg items-center justify-center';

  const variantClasses = {
    primary: 'bg-primary-600 dark:bg-primary-500',
    secondary: 'bg-gray-600 dark:bg-navy-600',
    outline: 'border-2 border-primary-600 dark:border-primary-400 bg-transparent',
    danger: 'bg-red-600 dark:bg-red-500',
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
    outline: 'text-primary-600 dark:text-primary-400',
    danger: 'text-white',
  };

  const disabledClass = disabled || loading ? 'opacity-50' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  const spinnerColor = variant === 'outline' ? (isDark ? '#e0a252' : '#b8660f') : '#ffffff';

  return (
    <TouchableOpacity
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClass} ${widthClass}`}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text className={`font-semibold ${textSizeClasses[size]} ${textColorClasses[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

export default Button;
