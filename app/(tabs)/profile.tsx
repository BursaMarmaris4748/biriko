import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/services/auth-context';
import { useTheme } from '@/contexts/theme-context';
import {
  loadNotificationSettings, saveNotificationSettings, requestPermission,
  scheduleDailyReminder, cancelAllNotifications, NotificationSettings,
} from '@/services/notifications';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, toggle } = useTheme();
  const [updateChecking, setUpdateChecking] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const kullaniciAdi = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  const email = user?.email || '';

  useEffect(() => { loadNotificationSettings().then(setNotifSettings); }, []);

  const pickerDate = (() => {
    const [h, m] = (notifSettings?.dailyReminderTime || '21:00').split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  })();

  const updateNotif = useCallback(async (updates: Partial<NotificationSettings>) => {
    if (!notifSettings) return;
    const yeni = { ...notifSettings, ...updates };
    setNotifSettings(yeni);
    await saveNotificationSettings(yeni);
    if (updates.dailyReminder !== undefined || updates.dailyReminderTime !== undefined) await scheduleDailyReminder(yeni);
    if (updates.dailyReminder === false) await cancelAllNotifications();
  }, [notifSettings]);

  const handleToggleNotifications = async () => {
    if (!notifSettings) return;
    const yeniDurum = !notifSettings.dailyReminder;
    if (yeniDurum) {
      const izin = await requestPermission();
      if (!izin) { Alert.alert('İzin Gerekli', 'Bildirim almak için izin vermelisin.'); return; }
    }
    await updateNotif({ dailyReminder: yeniDurum });
  };

  const onTimeChange = async (_event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (!selectedDate) return;
    const saat = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;
    await updateNotif({ dailyReminderTime: saat });
  };

  const checkForUpdates = async () => {
    setUpdateChecking(true);
    try {
      const Updates = await import('expo-updates');
      if (!Updates.isEnabled) { Alert.alert('Bilgi', 'Güncelleme kontrolü kullanılamıyor.'); return; }
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        Alert.alert('Güncelleme Mevcut', 'Yeni güncelleme var. İndirilsin mi?', [
          { text: 'İptal', style: 'cancel' },
          { text: 'İndir ve Uygula', onPress: async () => { await Updates.fetchUpdateAsync(); await Updates.reloadAsync(); } },
        ]);
      } else { Alert.alert('Güncel', 'Uygulamanız en son sürümde.'); }
    } catch { Alert.alert('Hata', 'Güncelleme kontrolü başarısız.'); }
    finally { setUpdateChecking(false); }
  };

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const SectionCard = ({ children, last }: { children: React.ReactNode; last?: boolean }) => (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }} className="px-4 py-4">
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-3 pb-6">
          <Text style={{ color: colors.text }} className="text-2xl font-bold">Ayarlar</Text>
        </View>

        {/* Profil */}
        <View className="mx-5 rounded-3xl p-5 mb-6 border" style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.accent }}>
              <Text className="text-white font-bold text-xl">{kullaniciAdi.split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}</Text>
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="font-bold text-lg">{kullaniciAdi}</Text>
              <Text style={{ color: colors.text2 }} className="text-sm">{email}</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.green }} />
                <Text style={{ color: colors.green }} className="text-xs font-medium">Aktif</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Görünüm */}
        <View className="mx-5 mb-6">
          <Text style={{ color: colors.text2 }} className="text-xs font-semibold tracking-wider uppercase mb-2 px-1">Görünüm</Text>
          <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3 flex-1">
                <MaterialCommunityIcons name={isDark ? 'weather-night' : 'weather-sunny'} size={20} color={colors.text} />
                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="text-sm font-medium">Koyu Mod</Text>
                  <Text style={{ color: colors.text3 }} className="text-xs">{isDark ? 'Açık' : 'Kapalı'}</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Bildirimler */}
        <View className="mx-5 mb-6">
          <Text style={{ color: colors.text2 }} className="text-xs font-semibold tracking-wider uppercase mb-2 px-1">Bildirimler</Text>
          <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View className="flex-row items-center gap-3 flex-1">
                <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text2} />
                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="text-sm font-medium">Günlük Hatırlatma</Text>
                  <Text style={{ color: colors.text3 }} className="text-xs">{notifSettings?.dailyReminderTime || '21:00'}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleToggleNotifications}
                className="w-12 h-7 rounded-full items-center justify-center"
                style={{ backgroundColor: notifSettings?.dailyReminder ? colors.accent : colors.text3 }}
              >
                <View className={`w-5 h-5 rounded-full bg-white ${notifSettings?.dailyReminder ? 'self-end mr-0.5' : 'self-start ml-0.5'}`} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.text2} />
                <Text style={{ color: colors.text }} className="text-sm font-medium">Hatırlatma Saati</Text>
              </View>
              <Text style={{ color: colors.accent }} className="font-semibold text-sm">{notifSettings?.dailyReminderTime || '21:00'}</Text>
            </TouchableOpacity>
          </View>
          {showTimePicker && notifSettings && <DateTimePicker value={pickerDate} mode="time" is24Hour onChange={onTimeChange} />}
        </View>

        {/* Genel */}
        <View className="mx-5 mb-6">
          <Text style={{ color: colors.text2 }} className="text-xs font-semibold tracking-wider uppercase mb-2 px-1">Genel</Text>
          <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="currency-try" size={20} color={colors.text2} />
                <Text style={{ color: colors.text }} className="text-sm font-medium">Para Birimi</Text>
              </View>
              <Text style={{ color: colors.text3 }} className="text-sm">₺ TRY</Text>
            </View>
            <View className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="calendar-month" size={20} color={colors.text2} />
                <Text style={{ color: colors.text }} className="text-sm font-medium">Bütçe Dönemi</Text>
              </View>
              <Text style={{ color: colors.text3 }} className="text-sm">Aylık</Text>
            </View>
          </View>
        </View>

        {/* Uygulama */}
        <View className="mx-5 mb-6">
          <Text style={{ color: colors.text2 }} className="text-xs font-semibold tracking-wider uppercase mb-2 px-1">Uygulama</Text>
          <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="information-outline" size={20} color={colors.text2} />
                <Text style={{ color: colors.text }} className="text-sm font-medium">Sürüm</Text>
              </View>
              <Text style={{ color: colors.text3 }} className="text-sm">1.0.0</Text>
            </View>
            <TouchableOpacity onPress={checkForUpdates} disabled={updateChecking} className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="update" size={20} color={colors.text2} />
                <Text style={{ color: colors.text }} className="text-sm font-medium">Güncellemeleri Kontrol Et</Text>
              </View>
              {updateChecking ? <ActivityIndicator size="small" color={colors.accent} /> : <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} />}
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.text2} />
                <Text style={{ color: colors.text }} className="text-sm font-medium">Kullanım Koşulları</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.text2} />
                <Text style={{ color: colors.text }} className="text-sm font-medium">Gizlilik Politikası</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Çıkış */}
        <View className="mx-5 mt-2">
          <TouchableOpacity onPress={handleSignOut} className="flex-row items-center justify-center gap-2 rounded-2xl py-4" style={{ backgroundColor: colors.card, borderColor: colors.red + '40', borderWidth: 1 }}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
            <Text style={{ color: colors.red }} className="font-bold text-base">Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.text3, textAlign: 'center' }} className="text-xs mt-8">Biriko v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
