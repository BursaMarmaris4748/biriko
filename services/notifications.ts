import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = '@biriko/notifications';

export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;
  budgetAlerts: boolean;
}

const defaultSettings: NotificationSettings = {
  dailyReminder: true,
  dailyReminderTime: '21:00',
  budgetAlerts: true,
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const json = await AsyncStorage.getItem(NOTIF_KEY);
    if (json) return { ...defaultSettings, ...JSON.parse(json) };
    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(settings));
}

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0058bc',
    });
  }

  return true;
}

export async function scheduleDailyReminder(settings: NotificationSettings): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-reminder');

  if (!settings.dailyReminder) return;

  const [hour, minute] = settings.dailyReminderTime.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: 'Biriko',
      body: 'Bugünkü harcamalarını kaydettin mi?',
      sound: true,
      color: '#0058bc',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleBudgetAlert(gelir: number, gider: number, limit: number): Promise<void> {
  const oran = gelir > 0 ? (gider / gelir) * 100 : 0;

  if (oran >= limit) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'budget-alert',
      content: {
        title: 'Bütçe Uyarısı',
        body: `Harcamaların gelirinin %${oran.toFixed(0)}'ine ulaştı. Dikkatli ol!`,
        sound: true,
        color: '#ba1a1a',
      },
      trigger: null,
    });
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
