import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useUserStore } from '@/store/useUserStore';

// Dark reads as genuinely black-navy (violet only shows up as an accent, not
// as the dominant wash); light is clean white with the faintest violet tint —
// same idea, opposite weight.
const HERO_GRADIENT: { dark: string[]; light: string[] } = {
  dark: ['#04050b', '#0a0e1a', '#1b1030'],
  light: ['#ffffff', '#f8f7ff', '#f0ecfe'],
};

/** Soft layered glow used behind the hero content — the same trick as a
 * blurred spotlight, built from plain views so it works identically on
 * web and native without a blur-per-pixel cost. */
function GlowOrb({ size, color, opacity, style }: { size: number; color: string; opacity: number; style?: object }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <View style={{ flex: 1, borderRadius: size / 2, backgroundColor: color, opacity }} />
    </View>
  );
}

function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  isDark: boolean;
}) {
  // BlurView isn't a react-native/react-native-web primitive, so NativeWind
  // won't transform a className placed directly on it — style the sized,
  // rounded, bordered container with a plain View and let BlurView fill it.
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel} activeOpacity={0.75}>
      <View
        className="w-11 h-11 rounded-full items-center justify-center overflow-hidden"
        style={{
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(17,22,42,0.12)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,22,42,0.04)',
        }}
      >
        <BlurView
          intensity={40}
          tint={isDark ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Ionicons name={icon} size={19} color={isDark ? '#ffffff' : '#11162a'} />
      </View>
    </TouchableOpacity>
  );
}

function EyebrowTag({ label }: { label: string }) {
  return (
    <View className="flex-row items-center mb-3">
      <View className="w-6 h-[2px] bg-primary-600 dark:bg-primary-400 mr-2" />
      <Text className="text-primary-700 dark:text-primary-300 text-xs font-bold tracking-[2px]">{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user, isAuthenticated } = useUserStore();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const gradient = isDark ? HERO_GRADIENT.dark : HERO_GRADIENT.light;

  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 bg-white dark:bg-navy-950">
        <LinearGradient
          colors={gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <GlowOrb
          size={340}
          color={isDark ? '#8b5cf6' : '#7c3aed'}
          opacity={isDark ? 0.14 : 0.06}
          style={{ top: -120, right: -100 }}
        />
        <GlowOrb
          size={220}
          color={isDark ? '#a78bfa' : '#8b5cf6'}
          opacity={isDark ? 0.1 : 0.05}
          style={{ bottom: 160, left: -80 }}
        />

        {/* Top nav */}
        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 items-center justify-center mr-2.5">
              <Ionicons name="pulse" size={18} color="#ffffff" />
            </View>
            <Text className="text-navy-900 dark:text-white font-bold text-base tracking-wide">AwesomeProject</Text>
          </View>
          <GlassIconButton
            icon={isDark ? 'sunny-outline' : 'moon-outline'}
            onPress={toggleTheme}
            accessibilityLabel="Toggle dark mode"
            isDark={isDark}
          />
        </View>

        <View className="flex-1 items-center justify-center" pointerEvents="none">
          <Ionicons name="pulse" size={280} color={isDark ? '#ffffff' : '#7c3aed'} style={{ opacity: 0.05 }} />
        </View>

        {/* Overlay content card */}
        <View className="px-6 pb-8" style={{ paddingBottom: insets.bottom + 28 }}>
          <View className="relative">
            {/* Badge overlapping the top-right corner of the card */}
            <View
              className="absolute z-10 w-[76px] h-[76px] rounded-full bg-white dark:bg-navy-900 border-2 border-primary-500 dark:border-primary-400 items-center justify-center"
              style={{ top: -32, right: 18, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
            >
              <Ionicons name="shield-checkmark" size={22} color={isDark ? '#c4b5fd' : '#7c3aed'} />
              <Text className="text-primary-700 dark:text-primary-200 text-[9px] font-bold tracking-wider mt-0.5">SECURE</Text>
            </View>

            <View
              className="bg-white dark:bg-navy-900 rounded-3xl px-6 pt-7 pb-6 border border-gray-100 dark:border-white/10"
              style={{ shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}
            >
              <EyebrowTag label="PERSONAL · WORKSPACE" />
              <Text className="text-gray-900 dark:text-white text-3xl font-extrabold leading-tight mb-3">
                Everything you need,{'\n'}in one place.
              </Text>
              <Text className="text-gray-600 dark:text-navy-200 text-[15px] leading-relaxed mb-6">
                Chat with your people, manage your profile, and stay in control of your account —
                all from one focused workspace.
              </Text>

              <View className="flex-row" style={{ gap: 12 }}>
                <Link href="/auth/signup" asChild>
                  <View style={{ flex: 1 }}>
                    <Button title="Get Started" fullWidth />
                  </View>
                </Link>
                <Link href="/auth/login" asChild>
                  <View style={{ flex: 1 }}>
                    <Button title="Sign In" variant="outline" fullWidth />
                  </View>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-navy-950">
      {/* Hero banner */}
      <View style={{ height: 240 }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <GlowOrb
          size={260}
          color={isDark ? '#8b5cf6' : '#7c3aed'}
          opacity={isDark ? 0.14 : 0.06}
          style={{ top: -90, right: -70 }}
        />
        <GlowOrb
          size={160}
          color={isDark ? '#a78bfa' : '#8b5cf6'}
          opacity={isDark ? 0.1 : 0.05}
          style={{ bottom: -60, left: -40 }}
        />

        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 items-center justify-center mr-2">
              <Ionicons name="pulse" size={16} color="#ffffff" />
            </View>
            <Text className="text-navy-900 dark:text-white font-bold text-sm tracking-wide">AwesomeProject</Text>
          </View>
          <GlassIconButton
            icon={isDark ? 'sunny-outline' : 'moon-outline'}
            onPress={toggleTheme}
            accessibilityLabel="Toggle dark mode"
            isDark={isDark}
          />
        </View>

        <View className="flex-1 justify-end px-6 pb-6">
          <View className="flex-row items-center">
            <View
              className="rounded-full border-2"
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(17,22,42,0.12)',
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <Avatar uri={user.avatar} name={user.name} size="lg" />
            </View>
            <View className="ml-4">
              <Text className="text-navy-700 dark:text-white/70 text-xs font-semibold tracking-wide mb-0.5">
                WELCOME BACK
              </Text>
              <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">{user.name}</Text>
              <Text className="text-sm text-gray-500 dark:text-white/60">{user.email}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 -mt-5" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View
          className="bg-white dark:bg-navy-900 rounded-t-3xl px-6 pt-7"
          style={{ minHeight: 200 }}
        >
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</Text>

          <View className="flex-row" style={{ gap: 12 }}>
            <QuickActionTile href="/chat" icon="chatbubble-outline" label="Messages" isDark={isDark} />
            <QuickActionTile href="/profile" icon="person-outline" label="Profile" isDark={isDark} />
            <QuickActionTile href="/settings" icon="settings-outline" label="Settings" isDark={isDark} />
          </View>

          <TouchableOpacity onPress={logout} className="mt-10 mb-2 self-center flex-row items-center">
            <Ionicons name="log-out-outline" size={16} color="#ef4444" />
            <Text className="text-red-500 font-semibold ml-1.5">Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickActionTile({
  href,
  icon,
  label,
  isDark,
}: {
  href: '/chat' | '/profile' | '/settings';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isDark: boolean;
}) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity
        className="flex-1 items-center bg-gray-50 dark:bg-navy-800 rounded-2xl py-5"
        activeOpacity={0.7}
      >
        <View className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-500/20 items-center justify-center mb-2">
          <Ionicons name={icon} size={20} color={isDark ? '#a78bfa' : '#7c3aed'} />
        </View>
        <Text className="text-xs font-semibold text-gray-800 dark:text-navy-100">{label}</Text>
      </TouchableOpacity>
    </Link>
  );
}
