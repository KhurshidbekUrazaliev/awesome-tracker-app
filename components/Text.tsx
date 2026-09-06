import { Text as RNText, TextProps } from 'react-native';

/**
 * Drop-in replacement for RN's Text that defaults to the app's body typeface
 * (Plus Jakarta Sans) — there's no other place text styling is centralized,
 * so every screen imports this instead of 'react-native' directly.
 */
export default function Text({ className, ...props }: TextProps & { className?: string }) {
  return <RNText className={`font-sans ${className ?? ''}`} {...props} />;
}
