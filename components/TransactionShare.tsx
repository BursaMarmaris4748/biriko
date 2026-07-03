import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';
import { loadData, Transaction } from '@/services/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (transaction: Transaction) => void;
}

export default function TransactionShare({ visible, onClose, onSelect }: Props) {
  const { colors, isDark } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (visible) loadData().then(d => setTransactions(d.transactions.slice(-30).reverse()));
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" onPress={onClose}>
        <Pressable onPress={() => {}}
          className="rounded-t-3xl p-5 border-t"
          style={{ backgroundColor: colors.card, borderColor: colors.border, maxHeight: '70%' }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ color: colors.text }} className="font-bold text-lg">İşlem Paylaş</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text3} />
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View className="items-center py-10">
              <MaterialCommunityIcons name="swap-horizontal-bold" size={40} color={colors.text3} />
              <Text style={{ color: colors.text3 }} className="text-sm mt-3">Henüz işlem yok</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={t => t.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isGelir = item.type === 'gelir';
                return (
                  <TouchableOpacity onPress={() => onSelect(item)}
                    className="flex-row items-center px-4 py-3.5 rounded-xl mb-2"
                    style={{ backgroundColor: colors.inputBg }}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: isGelir ? '#d1fae5' : '#fce8ed' }}
                    >
                      <MaterialCommunityIcons
                        name={isGelir ? 'arrow-down-circle' : 'arrow-up-circle'}
                        size={20}
                        color={isGelir ? '#10b981' : '#ba1a1a'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.text }} className="font-semibold text-sm">{item.category}</Text>
                      <Text style={{ color: colors.text3 }} className="text-xs">{item.note}</Text>
                    </View>
                    <Text style={{ color: isGelir ? '#10b981' : '#ba1a1a' }} className="font-bold text-base">
                      {isGelir ? '+' : '-'}{item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
