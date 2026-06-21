import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SavingsGoal } from '@/services/storage';

const PERIYOT_LABEL: Record<string, string> = {
  gunluk: 'Günlük',
  haftalik: 'Haftalık',
  aylik: 'Aylık',
};

const PERIYOT_ICON: Record<string, string> = {
  gunluk: 'calendar-today',
  haftalik: 'calendar-week',
  aylik: 'calendar-month',
};

export const BirikimKarti: React.FC<{
  goals: SavingsGoal[];
  onGoalPress: (goal: SavingsGoal) => void;
  onNewGoal: () => void;
}> = ({ goals, onGoalPress, onNewGoal }) => {
  if (goals.length === 0) {
    return (
      <View className="mx-4 mb-5 bg-white rounded-2xl p-5 border border-[#e7eefe]">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 rounded-full items-center justify-center bg-[#dbeafe]">
            <MaterialCommunityIcons name="piggy-bank" size={16} color="#1e40af" />
          </View>
          <Text className="text-[#151c27] font-bold text-base">Birikim Hedefleri</Text>
        </View>
        <Text className="text-[#727786] text-sm mb-4">Henüz bir birikim hedefin yok. Hemen başla!</Text>
        <TouchableOpacity
          onPress={onNewGoal}
          className="flex-row items-center justify-center gap-2 border-2 border-dashed border-[#c1c6d7] rounded-2xl py-4"
        >
          <MaterialCommunityIcons name="plus-circle" size={22} color="#0058bc" />
          <Text className="text-[#0058bc] font-bold text-sm">Yeni Hedef Oluştur</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="mx-4 mb-5">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full items-center justify-center bg-[#d1fae5]">
            <MaterialCommunityIcons name="piggy-bank" size={16} color="#065f46" />
          </View>
          <Text className="text-[#151c27] font-bold text-base">Birikim Hedefleri</Text>
        </View>
        <TouchableOpacity onPress={onNewGoal}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="#0058bc" />
        </TouchableOpacity>
      </View>

      {goals.map((goal) => {
        const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
        const progressPercent = Math.min(progress * 100, 100);
        const kalan = goal.targetAmount - goal.currentAmount;
        const tamamlandi = goal.currentAmount >= goal.targetAmount;

        return (
          <TouchableOpacity
            key={goal.id}
            onPress={() => onGoalPress(goal)}
            className="bg-white rounded-2xl p-4 mb-3 border border-[#e7eefe]"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name={tamamlandi ? 'star-circle' : 'target'}
                  size={20}
                  color={tamamlandi ? '#f59e0b' : '#0058bc'}
                />
                <Text className={`text-[#151c27] font-bold text-base ${tamamlandi ? 'text-[#f59e0b]' : ''}`}>
                  {goal.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MaterialCommunityIcons name={PERIYOT_ICON[goal.period] as any} size={14} color="#9ca3af" />
                <Text className="text-[#9ca3af] text-xs">{PERIYOT_LABEL[goal.period]}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="h-3 bg-[#e8ecf4] rounded-full mb-2 overflow-hidden">
              <View
                className={`h-full rounded-full ${tamamlandi ? 'bg-[#f59e0b]' : 'bg-[#10b981]'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </View>

            {/* Amounts */}
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-[#1a1a2e] font-bold text-lg">
                  ₺{goal.currentAmount.toLocaleString('tr-TR')}
                </Text>
                <Text className="text-[#9ca3af] text-xs">
                  / ₺{goal.targetAmount.toLocaleString('tr-TR')}
                </Text>
              </View>
              <View className="items-end">
                {tamamlandi ? (
                  <View className="flex-row items-center gap-1 bg-[#fef3c7] px-3 py-1 rounded-full">
                    <MaterialCommunityIcons name="check-circle" size={14} color="#f59e0b" />
                    <Text className="text-[#f59e0b] font-bold text-xs">Hedefe Ulaşıldı</Text>
                  </View>
                ) : (
                  <>
                    <Text className="text-[#727786] text-xs font-medium">Kalan</Text>
                    <Text className="text-[#ba1a1a] font-bold text-sm">
                      ₺{kalan.toLocaleString('tr-TR')}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BirikimKarti;
