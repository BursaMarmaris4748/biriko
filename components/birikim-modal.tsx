import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SavingsGoal, BirikimPeriyot } from '@/services/storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface Props {
  visible: boolean;
  editingGoal?: SavingsGoal | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    targetAmount: number;
    period: BirikimPeriyot;
    targetDate?: string;
  }) => void;
  onAddContribution: (data: { goalId: string; amount: number; note?: string }) => void;
}

const PERIYOTLAR: { label: string; value: BirikimPeriyot; icon: string }[] = [
  { label: 'Günlük', value: 'gunluk', icon: 'calendar-today' },
  { label: 'Haftalık', value: 'haftalik', icon: 'calendar-week' },
  { label: 'Aylık', value: 'aylik', icon: 'calendar-month' },
];

export const BirikimModal: React.FC<Props> = ({
  visible,
  editingGoal,
  onClose,
  onSave,
  onAddContribution,
}) => {
  const [step, setStep] = useState<'goal' | 'contribute'>('goal');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [period, setPeriod] = useState<BirikimPeriyot>('aylik');
  const [contributeAmount, setContributeAmount] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('goal');
      if (editingGoal) {
        setName(editingGoal.name);
        setTargetAmount(editingGoal.targetAmount.toString());
        setPeriod(editingGoal.period);
      } else {
        setName('');
        setTargetAmount('');
        setPeriod('aylik');
      }
      setContributeAmount('');
      Animated.spring(slideAnim, {
        toValue: 1, useNativeDriver: true, damping: 20, stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, editingGoal, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const handleSaveGoal = () => {
    if (!name.trim() || !targetAmount.trim()) {
      Alert.alert('Uyarı', 'Hedef adı ve tutarı gerekli.');
      return;
    }
    const amount = parseFloat(targetAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir tutar girin.');
      return;
    }
    onSave({ name: name.trim(), targetAmount: amount, period });
    onClose();
  };

  const handleContribute = () => {
    if (!contributeAmount.trim()) return;
    const amount = parseFloat(contributeAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    if (!editingGoal) return;
    onAddContribution({ goalId: editingGoal.id, amount });
    setContributeAmount('');
    onClose();
  };

  const PERIYOT_LABEL: Record<BirikimPeriyot, string> = {
    gunluk: 'Günlük',
    haftalik: 'Haftalık',
    aylik: 'Aylık',
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <TouchableOpacity className="absolute inset-0 bg-black/40" activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={{ transform: [{ translateY }], height: SHEET_HEIGHT }}
          className="bg-[#f9f9ff] rounded-t-[24px] overflow-hidden"
        >
          {/* Drag Handle */}
          <View className="w-full items-center pt-3 pb-1">
            <View className="w-12 h-1.5 bg-[#c1c6d7] rounded-full" />
          </View>

          {/* Step Switcher */}
          <View className="px-5 py-4 border-b border-[#dce2f3]">
            <View className="flex-row justify-between items-center">
              <Text className="text-[#151c27] font-bold text-lg">
                {editingGoal ? 'Birikim Yap' : 'Yeni Hedef'}
              </Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <MaterialCommunityIcons name="close" size={24} color="#414754" />
              </TouchableOpacity>
            </View>
            {editingGoal && (
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  onPress={() => setStep('goal')}
                  className={`px-4 py-2 rounded-full ${step === 'goal' ? 'bg-[#0058bc]' : 'bg-[#e7eefe]'}`}
                >
                  <Text className={`text-xs font-bold ${step === 'goal' ? 'text-white' : 'text-[#414754]'}`}>
                    Hedef Bilgisi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStep('contribute')}
                  className={`px-4 py-2 rounded-full ${step === 'contribute' ? 'bg-[#0058bc]' : 'bg-[#e7eefe]'}`}
                >
                  <Text className={`text-xs font-bold ${step === 'contribute' ? 'text-white' : 'text-[#414754]'}`}>
                    Birikim Ekle
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <ScrollView className="flex-1 px-5 py-4" keyboardShouldPersistTaps="handled">
            {step === 'goal' && (
              <>
                {/* Hedef Adı */}
                <Text className="text-[#727786] text-xs font-semibold tracking-wider uppercase mb-2">Hedef Adı</Text>
                <View className="flex-row items-center border border-[#e8ecf4] rounded-2xl px-4 mb-4 h-[52] bg-white">
                  <MaterialCommunityIcons name="piggy-bank" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-[#1a1a2e]"
                    placeholder="Örn: Tatil, Araba, Acil Durum"
                    placeholderTextColor="#b0b7c3"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Hedef Tutar */}
                <Text className="text-[#727786] text-xs font-semibold tracking-wider uppercase mb-2">Hedef Tutar</Text>
                <View className="flex-row items-center border border-[#e8ecf4] rounded-2xl px-4 mb-4 h-[52] bg-white">
                  <Text className="text-[#9ca3af] font-bold text-lg">₺</Text>
                  <TextInput
                    className="flex-1 ml-3 text-base text-[#1a1a2e]"
                    placeholder="0,00"
                    placeholderTextColor="#b0b7c3"
                    keyboardType="decimal-pad"
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                  />
                </View>

                {/* Periyot Seçimi */}
                <Text className="text-[#727786] text-xs font-semibold tracking-wider uppercase mb-3">
                  Birikim Varyantı
                </Text>
                <View className="bg-[#f0f3ff] p-1 rounded-2xl flex-row mb-6">
                  {PERIYOTLAR.map((p) => {
                    const secili = period === p.value;
                    return (
                      <TouchableOpacity
                        key={p.value}
                        onPress={() => setPeriod(p.value)}
                        className={`flex-1 py-3 items-center rounded-2xl ${secili ? 'bg-white shadow-sm' : ''}`}
                        style={secili ? { elevation: 2 } : {}}
                      >
                        <MaterialCommunityIcons
                          name={p.icon as any}
                          size={18}
                          color={secili ? '#0058bc' : '#727786'}
                        />
                        <Text className={`text-xs font-semibold mt-1 ${secili ? 'text-[#0058bc]' : 'text-[#727786]'}`}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Hedef Tarih */}
                <Text className="text-[#727786] text-xs font-semibold tracking-wider uppercase mb-2">
                  Hedef Tarih (İsteğe bağlı)
                </Text>
                <TextInput
                  className="border border-[#e8ecf4] rounded-2xl px-4 h-[52] bg-white text-base text-[#1a1a2e]"
                  placeholder="2025-12-31"
                  placeholderTextColor="#b0b7c3"
                  value={undefined}
                  onChangeText={() => {}}
                />
                <Text className="text-[#b0b7c3] text-xs mt-1 mb-4">YYYY-AA-GG formatında girin</Text>
              </>
            )}

            {step === 'contribute' && editingGoal && (
              <>
                {/* Goal Summary */}
                <View className="bg-white rounded-2xl p-4 border border-[#e8ecf4] mb-6">
                  <Text className="text-[#1a1a2e] font-bold text-base mb-1">{editingGoal.name}</Text>
                  <View className="flex-row items-center gap-2 mb-2">
                    <MaterialCommunityIcons name="calendar" size={14} color="#9ca3af" />
                    <Text className="text-[#9ca3af] text-xs">{PERIYOT_LABEL[editingGoal.period]} birikim</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[#1a1a2e] font-bold text-xl">
                      ₺{editingGoal.currentAmount.toLocaleString('tr-TR')}
                    </Text>
                    <Text className="text-[#9ca3af] text-sm">
                      / ₺{editingGoal.targetAmount.toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <View className="h-2 bg-[#e8ecf4] rounded-full mt-2 overflow-hidden">
                    <View
                      className="h-full rounded-full bg-[#10b981]"
                      style={{ width: `${Math.min((editingGoal.currentAmount / editingGoal.targetAmount) * 100, 100)}%` }}
                    />
                  </View>
                </View>

                {/* Contribution Amount */}
                <Text className="text-[#727786] text-xs font-semibold tracking-wider uppercase mb-2">
                  Biriktirilecek Tutar
                </Text>
                <View className="flex-row items-center border border-[#e8ecf4] rounded-2xl px-4 mb-4 h-[52] bg-white">
                  <Text className="text-[#9ca3af] font-bold text-lg">₺</Text>
                  <TextInput
                    className="flex-1 ml-3 text-base text-[#1a1a2e]"
                    placeholder="0,00"
                    placeholderTextColor="#b0b7c3"
                    keyboardType="decimal-pad"
                    value={contributeAmount}
                    onChangeText={setContributeAmount}
                    autoFocus
                  />
                </View>

                {/* Quick Amounts */}
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {[50, 100, 250, 500, 1000].map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setContributeAmount(m.toString())}
                      className="px-4 py-2 rounded-full border border-[#e8ecf4] bg-white"
                    >
                      <Text className="text-[#0058bc] font-semibold text-sm">₺{m.toLocaleString('tr-TR')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Bottom Button */}
          <View className="px-5 py-4 border-t border-[#dce2f3]">
            {step === 'goal' ? (
              <TouchableOpacity
                onPress={handleSaveGoal}
                className="items-center justify-center bg-[#0058bc] py-3.5 rounded-2xl"
              >
                <Text className="text-white font-bold text-base">Hedefi Oluştur</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleContribute}
                disabled={!contributeAmount.trim()}
                className="items-center justify-center bg-[#10b981] py-3.5 rounded-2xl"
                style={{ opacity: contributeAmount.trim() ? 1 : 0.5 }}
              >
                <View className="flex-row items-center gap-2">
                  <MaterialCommunityIcons name="piggy-bank" size={20} color="#ffffff" />
                  <Text className="text-white font-bold text-base">Birikim Ekle</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BirikimModal;
