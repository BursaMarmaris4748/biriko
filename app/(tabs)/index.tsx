import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GelirGiderKarti } from '@/components/gelir-gider-karti';
import { IslemEkleModal } from '@/components/islem-ekle-modal';
import { getScannedData } from '@/services/scan-store';
import { useFinance } from '@/services/finance-context';
import { useTheme } from '@/contexts/theme-context';
import { useGroups } from '@/hooks/useGroups';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addTransaction, refresh } = useFinance();
  const { groups, loading: groupsLoading } = useGroups();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'gelir' | 'gider'>('gelir');
  const [modalAmount, setModalAmount] = useState<string | undefined>();
  const [modalCategory, setModalCategory] = useState<string | undefined>();
  const [modalNote, setModalNote] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      refresh();
      const scanned = getScannedData();
      if (scanned) {
        setModalType('gider');
        setModalAmount(scanned.amount.toString());
        setModalCategory(scanned.category);
        setModalNote(scanned.note);
        setModalVisible(true);
      }
    }, [refresh])
  );

  const handleGelirEkle = () => {
    setModalType('gelir');
    setModalAmount(undefined);
    setModalCategory(undefined);
    setModalNote(undefined);
    setModalVisible(true);
  };

  const handleGiderEkle = () => {
    setModalType('gider');
    setModalAmount(undefined);
    setModalCategory(undefined);
    setModalNote(undefined);
    setModalVisible(true);
  };

  const handleSave = async (data: { type: 'gelir' | 'gider'; amount: number; category: string; note: string }) => {
    await addTransaction(data);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <GelirGiderKarti
          onGelirEkle={handleGelirEkle}
          onGiderEkle={handleGiderEkle}
        />

        {/* Sohbetler Section */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="forum" size={18} color={colors.accent} />
              <Text style={{ color: colors.text }} className="font-bold text-lg">Sohbetler</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/groups' as any)}
              className="flex-row items-center gap-1"
            >
              <Text style={{ color: colors.accent }} className="text-sm font-semibold">Tümü</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {groupsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : groups.length === 0 ? (
            <TouchableOpacity onPress={() => router.push('/groups' as any)}
              className="rounded-2xl p-5 items-center border-2 border-dashed"
              style={{ borderColor: colors.border, backgroundColor: colors.card + '50' }}
            >
              <MaterialCommunityIcons name="forum-outline" size={32} color={colors.text3} />
              <Text style={{ color: colors.text3 }} className="text-sm font-medium mt-2">Henüz grubun yok</Text>
              <Text style={{ color: colors.accent }} className="text-xs mt-1 font-semibold">Grup oluştur veya katıl</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {groups.slice(0, 4).map(g => (
                <TouchableOpacity key={g.id} onPress={() => router.push(`/chat/${g.id}` as any)}
                  className="flex-1 min-w-[45%] rounded-2xl p-4"
                  style={{ backgroundColor: colors.card }}
                >
                  <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.accent + '20' }}
                    >
                      <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>
                        {g.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    {(g as any).unread > 0 && (
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accent }}>
                        <Text className="text-white font-bold text-[10px]">{(g as any).unread}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: colors.text }} className="font-bold text-sm" numberOfLines={1}>{g.name}</Text>
                  <Text style={{ color: colors.text3 }} className="text-[10px] mt-0.5">{g.invite_code}</Text>
                </TouchableOpacity>
              ))}
              {groups.length > 4 && (
                <TouchableOpacity onPress={() => router.push('/groups' as any)}
                  className="flex-1 min-w-[45%] rounded-2xl p-4 items-center justify-center"
                  style={{ backgroundColor: colors.shimmer }}
                >
                  <Text style={{ color: colors.accent }} className="font-bold text-sm">+{groups.length - 4} daha</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <IslemEkleModal
        visible={modalVisible}
        initialType={modalType}
        initialAmount={modalAmount}
        initialCategory={modalCategory}
        initialNote={modalNote}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
