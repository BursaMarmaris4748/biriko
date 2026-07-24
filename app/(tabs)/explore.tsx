import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinance } from '@/services/finance-context';
import { BirikimModal } from '@/components/birikim-modal';
import type { SavingsGoal } from '@/services/storage';

const PERIYOT_LABEL: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  gunluk: { label: 'Günlük', icon: 'weather-sunny', color: '#d97706', bg: '#fffbeb' },
  haftalik: { label: 'Haftalık', icon: 'calendar-week', color: '#7c3aed', bg: '#f3e8ff' },
  aylik: { label: 'Aylık', icon: 'calendar-month', color: '#1e40af', bg: '#dbeafe' },
};

const GoalCard = ({
  goal,
  onPress,
  onContribute,
}: {
  goal: SavingsGoal;
  onPress: () => void;
  onContribute: () => void;
}) => {
  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const progressPercent = Math.min(progress * 100, 100);
  const tamamlandi = goal.currentAmount >= goal.targetAmount;
  const periyot = PERIYOT_LABEL[goal.period];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="rounded-3xl p-5 mb-4"
      style={{
        backgroundColor: tamamlandi ? '#fffbeb' : '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: tamamlandi ? '#fef3c7' : periyot.bg }}
          >
            <MaterialCommunityIcons
              name={tamamlandi ? 'star' : 'piggy-bank'}
              size={24}
              color={tamamlandi ? '#f59e0b' : periyot.color}
            />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-lg text-[#1a1a2e]" numberOfLines={1}>{goal.name}</Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <MaterialCommunityIcons name={periyot.icon as any} size={14} color={periyot.color} />
              <Text className="text-xs font-medium" style={{ color: periyot.color }}>{periyot.label}</Text>
              {tamamlandi && (
                <View className="bg-[#fef3c7] px-2 py-0.5 rounded-full ml-1">
                  <Text className="text-[#f59e0b] font-bold text-[10px]">Tamamlandı</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {!tamamlandi && (
          <View className="bg-[#e8ecf4] px-3 py-1 rounded-full">
            <Text className="text-[#727786] font-bold text-xs">{progressPercent.toFixed(0)}%</Text>
          </View>
        )}
      </View>

      {/* Progress */}
      <View className="h-3 bg-[#e8ecf4] rounded-full overflow-hidden mb-3">
        <View
          className="h-full rounded-full"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: tamamlandi ? '#f59e0b' : '#0058bc',
          }}
        />
      </View>

      {/* Amounts */}
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-[#1a1a2e] font-bold text-2xl">
            ₺{goal.currentAmount.toLocaleString('tr-TR')}
          </Text>
          <Text className="text-[#9ca3af] text-sm mt-0.5">
            hedef: ₺{goal.targetAmount.toLocaleString('tr-TR')}
          </Text>
        </View>
        {!tamamlandi && (
          <TouchableOpacity
            onPress={onContribute}
            className="flex-row items-center gap-1.5 px-5 py-3 rounded-full"
            style={{ backgroundColor: '#0058bc' }}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
            <Text className="text-white font-bold text-sm">Birikim Yap</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function BirikimScreen() {
  const { savingsGoals, setSavingsGoal, addSavingsContribution } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const toplamBirikim = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const toplamHedef = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const genelProgress = toplamHedef > 0 ? (toplamBirikim / toplamHedef) * 100 : 0;
  const tamamlanan = savingsGoals.filter((g) => g.currentAmount >= g.targetAmount).length;

  const handleGoalPress = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setModalVisible(true);
  };

  const handleContributePress = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setModalVisible(true);
  };

  const handleSaveGoal = async (data: {
    name: string; targetAmount: number; period: 'gunluk' | 'haftalik' | 'aylik'; targetDate?: string;
  }) => {
    await setSavingsGoal(data);
  };

  const handleAddContribution = async (data: { goalId: string; amount: number; note?: string }) => {
    await addSavingsContribution(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f2f5f9]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-5 pt-3 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[#151c27] text-2xl font-bold">Birikim</Text>
            <Text className="text-[#727786] text-sm mt-0.5">
              {savingsGoals.length > 0
                ? `${savingsGoals.length} hedef, ${tamamlanan} tamamlandı`
                : 'Hedeflerine ulaşmak için birikim yap'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setEditingGoal(null); setModalVisible(true); }}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: '#0058bc' }}
          >
            <MaterialCommunityIcons name="plus" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Genel İlerleme Kartı */}
        {savingsGoals.length > 0 && (
          <View className="rounded-3xl p-6 mb-6 overflow-hidden" style={{ backgroundColor: '#0058bc' }}>
            <View className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
            <View className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
            <View className="relative z-10">
              <View className="flex-row items-center gap-2 mb-1">
                <MaterialCommunityIcons name="piggy-bank" size={20} color="#adc6ff" />
                <Text className="text-[#adc6ff] text-xs font-semibold tracking-wider uppercase">
                  Toplam Birikim
                </Text>
              </View>
              <Text className="text-white text-4xl font-bold tracking-tight mb-4">
                ₺{toplamBirikim.toLocaleString('tr-TR')}
              </Text>
              <View className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                <View className="h-full rounded-full bg-white" style={{ width: `${Math.min(genelProgress, 100)}%` }} />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-white/70 text-xs font-medium">
                  ₺{toplamHedef.toLocaleString('tr-TR')} hedef
                </Text>
                <Text className="text-white font-bold text-xs">{genelProgress.toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Hedefler */}
        {savingsGoals.length === 0 ? (
          <View className="items-center pt-12">
            <View className="w-20 h-20 rounded-3xl items-center justify-center mb-4" style={{ backgroundColor: '#e8ecf4' }}>
              <MaterialCommunityIcons name="piggy-bank-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-[#151c27] font-bold text-lg mb-1">Henüz Hedef Yok</Text>
            <Text className="text-[#727786] text-sm text-center mb-6 px-8">
              Tatil, araba, acil durum fonu...{'\n'}Hayal ettiğin şeyler için birikime başla
            </Text>
            <TouchableOpacity
              onPress={() => { setEditingGoal(null); setModalVisible(true); }}
              className="flex-row items-center gap-2 px-6 py-3.5 rounded-full"
              style={{ backgroundColor: '#0058bc' }}
            >
              <MaterialCommunityIcons name="plus-circle" size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base">İlk Hedefi Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          savingsGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onPress={() => handleGoalPress(goal)}
              onContribute={() => handleContributePress(goal)}
            />
          ))
        )}

        {/* Motive edici mesaj */}
        {savingsGoals.length > 0 && tamamlanan === savingsGoals.length && (
          <View className="items-center py-6">
            <MaterialCommunityIcons name="trophy" size={40} color="#f59e0b" />
            <Text className="text-[#f59e0b] font-bold text-lg mt-2">Tüm hedeflere ulaştın!</Text>
            <Text className="text-[#727786] text-sm">Harika iş çıkardın 🎉</Text>
          </View>
        )}

        {savingsGoals.length > 0 && tamamlanan < savingsGoals.length && (
          <TouchableOpacity
            onPress={() => { setEditingGoal(null); setModalVisible(true); }}
            className="border-2 border-dashed border-[#c1c6d7] rounded-3xl py-5 items-center mb-4"
          >
            <MaterialCommunityIcons name="plus-circle" size={28} color="#c1c6d7" />
            <Text className="text-[#727786] font-semibold text-sm mt-1">Yeni Hedef Ekle</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal */}
      <BirikimModal
        visible={modalVisible}
        editingGoal={editingGoal}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGoal}
        onAddContribution={handleAddContribution}
      />
    </SafeAreaView>
  );
}
