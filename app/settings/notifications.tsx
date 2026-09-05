import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import NotificationToggle from '@/modules/settings/components/NotificationToggle';
import { useSettingsStore } from '@/modules/settings/store/useSettingsStore';

export default function NotificationsScreen() {
  const { notifications, updateNotifications } = useSettingsStore();

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
      <ScrollView className="flex-1 bg-white dark:bg-navy-950">
        <View className="px-6 py-4">
          <Text className="text-sm text-gray-500 dark:text-navy-300 mb-4">
            Manage how you receive notifications
          </Text>
          
          <NotificationToggle
            title="Enable Notifications"
            description="Receive push notifications"
            value={notifications.enabled}
            onValueChange={(value) => updateNotifications({ enabled: value })}
          />
          
          <NotificationToggle
            title="Message Notifications"
            description="Get notified about new messages"
            value={notifications.messages}
            onValueChange={(value) => updateNotifications({ messages: value })}
          />
          
          <NotificationToggle
            title="Update Notifications"
            description="Get notified about app updates"
            value={notifications.updates}
            onValueChange={(value) => updateNotifications({ updates: value })}
          />
          
          <NotificationToggle
            title="Notification Sound"
            description="Play sound for notifications"
            value={notifications.sound}
            onValueChange={(value) => updateNotifications({ sound: value })}
          />
        </View>
      </ScrollView>
    </>
  );
}
