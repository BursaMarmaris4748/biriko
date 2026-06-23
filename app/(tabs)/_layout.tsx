import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, TouchableOpacity, View, Text, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';

const menuItems = [
  { icon: 'camera' as const, label: 'Kamera', route: '/scanner' },
  { icon: 'chart-bar' as const, label: 'İstatistikler', route: '/(tabs)/stats' },
  { icon: 'qrcode-scan' as const, label: 'QR Okut', route: '/scanner' },
  { icon: 'file-document-plus' as const, label: 'Hızlı Gider', route: '/' },
  { icon: 'currency-usd' as const, label: 'Kur Takibi', route: '/' },
];

export default function TabLayout() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 8,
            shadowColor: '#000',
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#0058bc',
          tabBarInactiveTintColor: '#727786',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Anasayfa',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Birikim',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="piggy-bank" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: '',
            tabBarButton: () => (
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                className="flex-1 items-center justify-center"
                style={{ marginTop: Platform.OS === 'ios' ? -20 : -16 }}
              >
                <View className="w-14 h-14 rounded-full bg-[#0058bc] items-center justify-center shadow-lg"
                  style={{
                    shadowColor: '#0058bc',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <MaterialCommunityIcons name="menu" size={28} color="#ffffff" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Yatırım',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-line" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Ayarlar',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="account" size={22} color={color} />
            ),
          }}
        />
      </Tabs>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable className="flex-1" onPress={() => setMenuVisible(false)}>
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
                onPress={() => {
                  setMenuVisible(false);
                  router.push(item.route as any);
                }}
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
    </>
  );
}
