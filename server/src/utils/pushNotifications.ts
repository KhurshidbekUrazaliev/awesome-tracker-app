import { logger } from '../logger';

/**
 * Sends a push notification via Expo's push API. Fire-and-forget: a failure
 * here (missing/invalid token, Expo's service being down) should never break
 * the request that triggered it -- notifications are a nice-to-have, not a
 * dependency for the underlying action to succeed.
 */
export async function sendPushNotification(
  pushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!pushToken) return;

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, data }),
    });
    if (!response.ok) {
      logger.warn({ status: response.status }, 'Push notification request failed');
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to send push notification');
  }
}
