import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

export async function registerPushToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: user.id, token }, { onConflict: 'user_id' });
  if (error) console.warn('[push] upsert error:', error);
}

export async function unregisterPushToken() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('push_tokens').delete().eq('user_id', user.id);
}

export async function fetchExpoPushToken(): Promise<string | null> {
  try {
    const Notifications = await import('expo-notifications');
    const token = await Notifications.getExpoPushTokenAsync();
    return token?.data || null;
  } catch {
    return null;
  }
}

export function getPushTokenPayload(token: string, groupId: string, senderName: string, content: string) {
  return {
    to: token,
    sound: 'default',
    title: senderName,
    body: content,
    data: { groupId },
    android: { channelId: 'chat-messages' },
    ...(Platform.OS === 'ios' ? { categoryId: 'chat' } : {}),
  };
}
