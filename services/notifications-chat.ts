import { supabase } from '@/lib/supabase';

export async function registerPushToken(token: string) {
  // Push token tablosu opsiyonel — şimdilik atla
}

export async function unregisterPushToken() {
  // Push token tablosu opsiyonel
}

export async function fetchExpoPushToken(): Promise<string | null> {
  try {
    const Notifications = await import('expo-notifications');
    const token = await Notifications.getExpoPushTokenAsync();
    return token?.data || null;
  } catch { return null; }
}

export function getPushTokenPayload(token: string, senderName: string, content: string, groupId: string) {
  return {
    to: token,
    sound: 'default',
    title: senderName,
    body: content,
    data: { groupId },
  };
}
