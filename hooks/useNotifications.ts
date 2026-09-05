import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import notificationService from '@/services/notificationService';

export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        const token = await notificationService.getPushToken();
        setPushToken(token);
      }
    };

    setupNotifications();

    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const scheduleNotification = async (title: string, body: string, data?: any) => {
    await notificationService.scheduleNotification(title, body, data);
  };

  const cancelAll = async () => {
    await notificationService.cancelAllNotifications();
  };

  return {
    pushToken,
    notification,
    scheduleNotification,
    cancelAll,
  };
}
