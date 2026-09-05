import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

type NotificationsModule = typeof import('expo-notifications');

// expo-notifications throws synchronously at import time on Android — not just when its
// push-token APIs are called — because one of its modules registers a device-push-token
// listener as a top-level side effect, and that listener setup is what's disallowed in
// Expo Go since SDK 53. So the module must never be require()'d there in the first place;
// a static `import` would run before any Expo-Go check could prevent it.
let Notifications: NotificationsModule | undefined;
if (!isRunningInExpoGo()) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a real require(), not a static import, to avoid loading the module at all in Expo Go
  const notifications: NotificationsModule = require('expo-notifications');
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  Notifications = notifications;
}

const NOOP_SUBSCRIPTION = { remove: () => {} };

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    const notifications = Notifications;
    if (!notifications) return false;

    const { status: existingStatus } = await notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  async getPushToken(): Promise<string | null> {
    // Remote push tokens need a development build — Expo Go can't provide one since SDK 53.
    const notifications = Notifications;
    if (!notifications) return null;
    try {
      const token = await notifications.getExpoPushTokenAsync();
      await AsyncStorage.setItem('pushToken', token.data);
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /** Sends the token to the backend so it can actually push notifications to this device. */
  async registerPushToken(pushToken: string): Promise<void> {
    try {
      await apiClient.post('/users/me/push-token', { pushToken });
    } catch (error) {
      console.error('Failed to register push token with the server:', error);
    }
  }

  async scheduleNotification(title: string, body: string, data?: any, triggerSeconds = 1) {
    const notifications = Notifications;
    if (!notifications) return;
    await notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds },
    });
  }

  async cancelAllNotifications() {
    const notifications = Notifications;
    if (!notifications) return;
    await notifications.cancelAllScheduledNotificationsAsync();
  }

  addNotificationReceivedListener(listener: (notification: import('expo-notifications').Notification) => void) {
    const notifications = Notifications;
    if (!notifications) return NOOP_SUBSCRIPTION;
    return notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: import('expo-notifications').NotificationResponse) => void
  ) {
    const notifications = Notifications;
    if (!notifications) return NOOP_SUBSCRIPTION;
    return notifications.addNotificationResponseReceivedListener(listener);
  }
}

export default new NotificationService();
