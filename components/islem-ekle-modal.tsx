import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IslemEkleModalProps {
  visible: boolean;
  initialType: 'gelir' | 'gider';
  initialAmount?: string;
  initialCategory?: string;
  initialNote?: string;
  onClose: () => void;
  onSave: (data: {
    type: 'gelir' | 'gider';
    amount: number;
    category: string;
    note: string;
  }) => void;
}

const KATEGORILER = [
  { label: 'Market', icon: 'cart' as const },
  { label: 'Fatura', icon: 'file-document' as const },
  { label: 'Kira', icon: 'home' as const },
  { label: 'Ulaşım', icon: 'bus' as const },
  { label: 'Eğlence', icon: 'movie-open' as const },
  { label: 'Diğer', icon: 'dots-horizontal' as const },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

export const IslemEkleModal: React.FC<IslemEkleModalProps> = ({
  visible,
  initialType,
  initialAmount,
  initialCategory,
  initialNote,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<'gelir' | 'gider'>(initialType);
  const [amount, setAmount] = useState(initialAmount || '');
  const [category, setCategory] = useState(initialCategory || 'Market');
  const [note, setNote] = useState(initialNote || '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount(initialAmount || '');
      setCategory(initialCategory || 'Market');
      setNote(initialNote || '');
      setSelectedDate(new Date());
      setShowDatePicker(false);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, initialType, initialAmount, initialCategory, initialNote, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const handleSave = () => {
    const temizTutar = amount.replace(',', '.');
    const sayi = parseFloat(temizTutar);
    if (isNaN(sayi) || sayi <= 0) return;
    onSave({ type, amount: sayi, category, note });
    onClose();
  };

  const AYLAR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];

  const formatTarih = (tarih: Date): string => {
    const bugun = new Date();
    const gun = tarih.getDate();
    const ay = AYLAR[tarih.getMonth()];
    if (
      tarih.getDate() === bugun.getDate() &&
      tarih.getMonth() === bugun.getMonth() &&
      tarih.getFullYear() === bugun.getFullYear()
    ) {
      return `Bugün, ${gun} ${ay}`;
    }
    return `${gun} ${ay} ${tarih.getFullYear()}`;
  };

  const onTarihChange = (_event: DateTimePickerEvent, secilenTarih?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (secilenTarih) {
      setSelectedDate(secilenTarih);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <TouchableOpacity
          className="absolute inset-0 bg-black/40"
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={{ transform: [{ translateY }], height: SHEET_HEIGHT }}
          className="bg-[#f9f9ff] rounded-t-[24px] overflow-hidden"
        >
          {/* Drag Handle */}
          <View className="w-full items-center pt-3 pb-1">
            <View className="w-12 h-1.5 bg-[#c1c6d7] rounded-full" />
          </View>

          {/* Header */}
          <View className="px-5 py-4 flex-row justify-between items-center border-b border-[#dce2f3]">
            <Text className="text-[#151c27] font-bold text-lg">İşlem Ekle</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <MaterialCommunityIcons name="close" size={24} color="#414754" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
          >
            <ScrollView className="flex-1 px-5 py-4">
              {/* Type Toggle */}
              <View className="bg-[#f0f3ff] p-1 rounded-full flex-row relative mb-6">
                <View
                  style={{
                    position: 'absolute',
                    left: type === 'gider' ? 4 : '50%' as any,
                    top: 4,
                    bottom: 4,
                    width: '50%' as any,
                    backgroundColor: '#ffffff',
                    borderRadius: 999,
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setType('gider')}
                  className="flex-1 py-2.5 items-center z-10"
                >
                  <Text
                    className={`font-bold text-sm ${type === 'gider' ? 'text-[#ba1a1a]' : 'text-[#414754]'}`}
                  >
                    Gider
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setType('gelir')}
                  className="flex-1 py-2.5 items-center z-10"
                >
                  <Text
                    className={`font-bold text-sm ${type === 'gelir' ? 'text-[#006c49]' : 'text-[#414754]'}`}
                  >
                    Gelir
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Amount Input */}
              <View className="items-center mb-6">
                <Text className="text-[#414754] text-xs font-semibold tracking-wider uppercase mb-2">Tutar</Text>
                <View className="flex-row items-center">
                  <Text className="text-[#727786] text-3xl font-bold mr-1">₺</Text>
                  <TextInput
                    className="bg-transparent text-center text-3xl font-bold text-[#151c27] w-32 p-0"
                    placeholder="0,00"
                    placeholderTextColor="#727786"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                  />
                </View>
              </View>

              {/* Categories */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-[#151c27] font-bold text-base">Kategori</Text>
                  <TouchableOpacity>
                    <Text className="text-[#0058bc] text-xs font-semibold">Tümü</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-4">
                  {KATEGORILER.map((item) => {
                    const secili = category === item.label;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => setCategory(item.label)}
                        className="items-center gap-1"
                      >
                        <View
                          className={`w-14 h-14 rounded-full items-center justify-center ${
                            secili ? 'bg-[#ffdad6]' : 'bg-[#e7eefe]'
                          }`}
                          style={secili ? { borderWidth: 2, borderColor: '#ba1a1a' } : {}}
                        >
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={24}
                            color={secili ? '#ba1a1a' : '#414754'}
                          />
                        </View>
                        <Text
                          className={`text-xs font-medium ${
                            secili ? 'text-[#151c27] font-semibold' : 'text-[#414754]'
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Details */}
              <View className="mb-6">
                {/* Date */}
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center border border-[#c1c6d7] rounded-lg bg-white mb-4 px-3 py-3"
                >
                  <MaterialCommunityIcons name="calendar" size={20} color="#414754" />
                  <Text className="text-[#151c27] ml-2 text-base">{formatTarih(selectedDate)}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View className="mb-4">
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={onTarihChange}
                      locale="tr-TR"
                    />
                  </View>
                )}

                {/* Note */}
                <View className="border border-[#c1c6d7] rounded-lg bg-white px-3 py-3">
                  <View className="flex-row items-start">
                    <MaterialCommunityIcons name="note-edit" size={20} color="#414754" style={{ marginTop: 2 }} />
                    <TextInput
                      className="flex-1 ml-2 text-[#151c27] text-base min-h-[40px]"
                      placeholder="Not ekle (İsteğe bağlı)"
                      placeholderTextColor="#727786"
                      multiline
                      value={note}
                      onChangeText={setNote}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Save Button */}
            <View className="px-5 py-4 border-t border-[#dce2f3] bg-[#f9f9ff]">
              <TouchableOpacity
                onPress={handleSave}
                className="flex-row items-center justify-center gap-2 bg-[#0058bc] py-3.5 rounded-xl"
              >
                <MaterialCommunityIcons name="check-circle" size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base">Kaydet</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default IslemEkleModal;
