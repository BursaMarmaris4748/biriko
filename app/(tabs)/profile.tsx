import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useAuth } from '@/services/auth-context';

const SETTINGS = [
  {
    section: 'Genel',
    items: [
      { icon: 'bell-outline', label: 'Bildirimler', type: 'toggle' },
      { icon: 'currency-try', label: 'Para Birimi', value: '₺ TRY', type: 'select' },
      { icon: 'calendar-month', label: 'Bütçe Dönemi', value: 'Aylık', type: 'select' },
    ],
  },
  {
    section: 'Güvenlik',
    items: [
      { icon: 'lock-outline', label: 'Şifre Değiştir', type: 'link' },
      { icon: 'two-factor-authentication', label: 'İki Adımlı Doğrulama', type: 'link' },
    ],
  },
  {
    section: 'Uygulama',
    items: [
      { icon: 'information-outline', label: 'Sürüm', value: '1.0.0', type: 'info' },
      { icon: 'update', label: 'Güncellemeleri Kontrol Et', type: 'update' },
      { icon: 'file-document-outline', label: 'Kullanım Koşulları', type: 'link' },
      { icon: 'shield-check-outline', label: 'Gizlilik Politikası', type: 'link' },
    ],
  },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [updateChecking, setUpdateChecking] = useState(false);
  const kullaniciAdi = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  const email = user?.email || '';

  const checkForUpdates = async () => {
    setUpdateChecking(true);
    try {
      if (!Updates.isEnabled) {
        Alert.alert('Bilgi', 'Güncelleme kontrolü şu an kullanılamıyor.');
        return;
      }
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        Alert.alert(
          'Güncelleme Mevcut',
          'Yeni bir güncelleme var. İndirilsin mi?',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'İndir ve Uygula',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert('Güncel', 'Uygulamanız en son sürümde.');
      }
    } catch {
      Alert.alert('Hata', 'Güncelleme kontrolü başarısız oldu.');
    } finally {
      setUpdateChecking(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabından çıkmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f2f5f9]" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-3 pb-6">
          <Text className="text-[#151c27] text-2xl font-bold">Ayarlar</Text>
        </View>

        {/* Profil Kartı */}
        <View className="mx-5 bg-white rounded-3xl p-5 mb-6 border border-[#e8ecf4]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-[#0058bc] items-center justify-center">
              <Text className="text-white font-bold text-xl">
                {kullaniciAdi.split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[#151c27] font-bold text-lg">{kullaniciAdi}</Text>
              <Text className="text-[#727786] text-sm">{email}</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <View className="w-2 h-2 rounded-full bg-[#10b981]" />
                <Text className="text-[#10b981] text-xs font-medium">Aktif</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ayarlar Grupları */}
        {SETTINGS.map((group, gi) => (
          <View key={gi} className="mx-5 mb-6">
            <Text className="text-[#727786] text-xs font-semibold tracking-wider uppercase mb-2 px-1">
              {group.section}
            </Text>
            <View className="bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden">
              {group.items.map((item, ii) => {
                const isLast = ii === group.items.length - 1;
                return (
                    <TouchableOpacity
                    key={ii}
                    onPress={item.type === 'update' ? checkForUpdates : undefined}
                    disabled={updateChecking}
                    className={`flex-row items-center justify-between px-4 py-4 ${!isLast ? 'border-b border-[#e8ecf4]' : ''}`}
                    activeOpacity={item.type === 'info' ? 1 : 0.6}
                  >
                    <View className="flex-row items-center gap-3">
                      <MaterialCommunityIcons name={item.icon as any} size={20} color="#414754" />
                      <Text className="text-[#151c27] text-sm font-medium">{item.label}</Text>
                    </View>
                    {'value' in item && (
                      <Text className="text-[#9ca3af] text-sm">{item.value}</Text>
                    )}
                    {item.type === 'link' && (
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#c1c6d7" />
                    )}
                    {item.type === 'update' && (
                      updateChecking ? (
                        <ActivityIndicator size="small" color="#0058bc" />
                      ) : (
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#c1c6d7" />
                      )
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Çıkış Yap */}
        <View className="mx-5 mt-2">
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 bg-white rounded-2xl py-4 border border-[#ffdad6]"
          >
            <MaterialCommunityIcons name="logout" size={20} color="#ba1a1a" />
            <Text className="text-[#ba1a1a] font-bold text-base">Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* Alt Bilgi */}
        <Text className="text-center text-[#c1c6d7] text-xs mt-8">Biriko v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
