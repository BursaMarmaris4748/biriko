import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const menuItems = [
  { icon: 'camera' as const, label: 'Kamera', desc: 'Fiş okut ve kaydet', route: '/scanner', color: '#0058bc' },
  { icon: 'chart-bar' as const, label: 'İstatistikler', desc: 'Harcama analizleri', route: '/(tabs)/stats', color: '#10B981' },
  { icon: 'qrcode-scan' as const, label: 'QR Okut', desc: 'Hızlı QR tarama', route: '/scanner', color: '#8B5CF6' },
  { icon: 'file-document-plus' as const, label: 'Hızlı Gider', desc: 'Tek dokunuşla gider ekle', route: '/', color: '#F7931A' },
  { icon: 'currency-usd' as const, label: 'Kur Takibi', desc: 'Canlı döviz kurları', route: '/', color: '#0055FF' },
];

export default function HamburgerMenuScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f2f5f9]">
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-full items-center justify-center border border-[#e7eefe]">
            <MaterialCommunityIcons name="close" size={22} color="#414754" />
          </TouchableOpacity>
          <Text className="text-[#151c27] text-2xl font-bold">Menü</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { router.push(item.route as any); }}
            className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: item.color + '15' }}>
              <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
            </View>
            <View className="flex-1">
              <Text className="text-[#151c27] font-bold text-base">{item.label}</Text>
              <Text className="text-[#9ca3af] text-xs mt-0.5">{item.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#c1c6d7" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
