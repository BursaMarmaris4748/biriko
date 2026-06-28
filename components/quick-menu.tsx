import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const menuItems = [
  { icon: 'camera' as const, label: 'Kamera', route: '/scanner' },
  { icon: 'chart-bar' as const, label: 'İstatistikler', route: '/(tabs)/stats' },
  { icon: 'qrcode-scan' as const, label: 'QR Okut', route: '/scanner' },
  { icon: 'file-document-plus' as const, label: 'Hızlı Gider', route: '/' },
  { icon: 'currency-usd' as const, label: 'Kur Takibi', route: '/' },
];

export default function QuickMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        <View className="absolute bottom-28 left-4 right-4 bg-white rounded-3xl shadow-lg border border-[#e8ecf4] p-2"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { onClose(); router.push(item.route as any); }}
              className="flex-row items-center gap-4 px-4 py-3.5 rounded-2xl active:bg-[#f0f7ff]"
            >
              <View className="w-10 h-10 rounded-xl bg-[#f0f7ff] items-center justify-center">
                <MaterialCommunityIcons name={item.icon} size={22} color="#0058bc" />
              </View>
              <Text className="text-[#151c27] font-semibold text-sm flex-1">{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#c1c6d7" />
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
