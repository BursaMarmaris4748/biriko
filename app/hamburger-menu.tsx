import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';

const menuItems = [
  { icon: 'camera' as const, label: 'Kamera', desc: 'Fiş okut ve kaydet', route: '/scanner', color: '#0058bc' },
  { icon: 'chart-bar' as const, label: 'İstatistikler', desc: 'Harcama analizleri', route: '/(tabs)/stats', color: '#10B981' },
  { icon: 'qrcode-scan' as const, label: 'QR Okut', desc: 'Hızlı QR tarama', route: '/scanner', color: '#8B5CF6' },
  { icon: 'file-document-plus' as const, label: 'Hızlı Gider', desc: 'Tek dokunuşla gider ekle', route: '/', color: '#F7931A' },
  { icon: 'currency-usd' as const, label: 'Kur Takibi', desc: 'Canlı döviz kurları', route: '/', color: '#0055FF' },
];

export default function HamburgerMenuScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text2} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>Menü</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { router.push(item.route as any); }}
            className="rounded-2xl p-4 mb-3 flex-row items-center"
            style={{ backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: item.color + '15' }}>
              <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base" style={{ color: colors.text }}>{item.label}</Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.text3 }}>{item.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text3} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
