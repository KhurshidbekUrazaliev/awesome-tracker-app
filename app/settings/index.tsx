import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import listingsService from '@/modules/listings/services/listingsService';

// Stripe's Account Links API requires a real https:// return/refresh URL — it
// rejects custom URL schemes like the try:// one Linking.createURL() would
// produce on native. Reuse the same deployed web origin expo-router itself
// is configured with (app.config.ts `extra.router.origin`), so completing
// onboarding on a native device lands on the web app's Settings page instead.
const WEB_ORIGIN = Constants.expoConfig?.extra?.router?.origin || 'https://khurshidbekurazaliev.github.io/awesome-tracker-app';

function PayoutsRow() {
  const [status, setStatus] = useState<{ connected: boolean; onboardingComplete: boolean } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    listingsService
      .getConnectStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const subtitle = status?.onboardingComplete
    ? 'Connected — ready to receive rental payouts'
    : status?.connected
    ? "Setup started — finish adding your payout details"
    : "Set this up to rent things out and get paid";

  const handlePress = async () => {
    try {
      setIsStarting(true);
      const returnUrl = Platform.OS === 'web' ? Linking.createURL('/settings') : `${WEB_ORIGIN}/settings`;
      const url = await listingsService.startConnectOnboarding(returnUrl, returnUrl);
      if (Platform.OS === 'web') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={isStarting} className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
      <Text className="text-base font-medium text-gray-900 dark:text-white">💳 Payouts</Text>
      <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-navy-950">
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</Text>

        <View className="space-y-2">
          <Link href="/settings/notifications" asChild>
            <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900 dark:text-white">🔔 Notifications</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">Manage notification preferences</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/settings/security" asChild>
            <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900 dark:text-white">🔒 Security</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">Two-factor auth and biometrics</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/settings/blocked" asChild>
            <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900 dark:text-white">🚫 Blocked Users</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">People you won&apos;t see or hear from</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/settings/location" asChild>
            <TouchableOpacity className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow-sm mb-2">
              <Text className="text-base font-medium text-gray-900 dark:text-white">📍 Location</Text>
              <Text className="text-sm text-gray-500 dark:text-navy-300 mt-1">Where your listings are, for nearby matching</Text>
            </TouchableOpacity>
          </Link>

          <PayoutsRow />
        </View>

        <TouchableOpacity onPress={logout} className="mt-8 mb-2 self-center flex-row items-center">
          <Ionicons name="log-out-outline" size={16} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-1.5">Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
