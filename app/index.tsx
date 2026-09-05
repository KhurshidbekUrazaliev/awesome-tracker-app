import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useUserStore } from '@/store/useUserStore';

// One photo set, four distinct roles — nothing repeats across the app so
// each screen keeps its own identity while sharing a visual language.
const HERO_IMAGES = {
  // Signed-out hero: full-bleed backdrop.
  hero: require('@/assets/hero/nabawi-sunset.jpg'),
  // Circular seal overlapping the content card.
  seal: require('@/assets/hero/clocktower-sky.jpg'),
  // Small floating photo card above the content card.
  marker: require('@/assets/hero/mosque-interior.jpg'),
  // Signed-in dashboard banner backdrop.
  banner: require('@/assets/hero/clocktower-twin.jpg'),
};

const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
// Absolutely-positioned <img> elements are replaced elements on web — inset:0
// alone doesn't stretch them the way it does a plain View/div, so the
// full-bleed background photos need an explicit 100%/100% on top of it.
const IMAGE_FILL = { ...FILL, width: '100%', height: '100%' } as const;

// A scrim over the photo, not a wash instead of one — transparent at the top
// so the photo reads clearly, resolving to the theme's own flat color by the
// bottom so it blends seamlessly into the card below.
const HERO_SCRIM: { dark: string[]; light: string[] } = {
  dark: ['rgba(4,5,11,0)', 'rgba(4,5,11,0.38)', 'rgba(4,5,11,0.94)'],
  light: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.96)'],
};
const SCRIM_STOPS = [0, 0.55, 1];

function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  // Always sits on a photo, never a flat surface — so its glass chrome stays
  // fixed (white-on-dark-blur) instead of following the light/dark theme.
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel} activeOpacity={0.75}>
      <View
        className="w-11 h-11 rounded-full items-center justify-center overflow-hidden"
        style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)' }}
      >
        <BlurView intensity={45} tint="dark" style={FILL} />
        <Ionicons name={icon} size={19} color="#ffffff" />
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

/** Small rotated photo card used as a floating accent over the hero photo. */
function FloatingPhoto({
  source,
  size,
  rotate,
  style,
}: {
  source: number;
  size: { width: number; height: number };
  rotate: string;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          ...size,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 3,
          borderColor: 'rgba(255,255,255,0.92)',
          transform: [{ rotate }],
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        },
        style,
      ]}
    >
      <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  );
}

export default function HomeScreen() {
  const { user, isAuthenticated } = useUserStore();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrim = isDark ? HERO_SCRIM.dark : HERO_SCRIM.light;

  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 bg-white dark:bg-navy-950">
        <Image source={HERO_IMAGES.hero} style={IMAGE_FILL} resizeMode="cover" />
        <LinearGradient
          colors={scrim}
          locations={SCRIM_STOPS}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={FILL}
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
            <Text
              className="font-bold text-base tracking-wide"
              style={{ color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } }}
            >
              AwesomeProject
            </Text>
          </View>
          <GlassIconButton
            icon={isDark ? 'sunny-outline' : 'moon-outline'}
            onPress={toggleTheme}
            accessibilityLabel="Toggle dark mode"
          />
        </View>

        {/* Floating photo accent, resting just above the content card */}
        <View className="flex-1 px-6" style={{ justifyContent: 'flex-end', paddingBottom: 12 }} pointerEvents="none">
          <FloatingPhoto
            source={HERO_IMAGES.marker}
            size={{ width: 112, height: 144 }}
            rotate="-6deg"
            style={{ alignSelf: 'flex-start' }}
          />
        </View>

        {/* Overlay content card */}
        <View className="px-6 pb-8" style={{ paddingBottom: insets.bottom + 28 }}>
          <View className="relative">
            {/* Seal overlapping the top-right corner of the card */}
            <View
              className="absolute z-10 rounded-full items-center justify-center overflow-hidden"
              style={{
                top: -32,
                right: 18,
                width: 76,
                height: 76,
                borderWidth: 3,
                borderColor: isDark ? '#1b1030' : '#ffffff',
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}
            >
              <Image source={HERO_IMAGES.seal} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View
                className="absolute z-10 rounded-full border-2 border-primary-500 dark:border-primary-400"
                style={FILL}
                pointerEvents="none"
              />
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
        <Image source={HERO_IMAGES.banner} style={IMAGE_FILL} resizeMode="cover" />
        <LinearGradient
          colors={scrim}
          locations={SCRIM_STOPS}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={FILL}
        />

        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 items-center justify-center mr-2">
              <Ionicons name="pulse" size={16} color="#ffffff" />
            </View>
            <Text
              className="font-bold text-sm tracking-wide"
              style={{ color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } }}
            >
              AwesomeProject
            </Text>
          </View>
          <GlassIconButton
            icon={isDark ? 'sunny-outline' : 'moon-outline'}
            onPress={toggleTheme}
            accessibilityLabel="Toggle dark mode"
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
