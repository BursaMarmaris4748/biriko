import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarketPrice, Investment, fetchMarketPrices, loadInvestments, saveInvestments } from '@/services/market-data';

const investmentTypes = [
  { type: 'gold' as const, label: 'Gram Altın', icon: 'gold' },
  { type: 'usd' as const, label: 'Dolar', icon: 'currency-usd' },
  { type: 'eur' as const, label: 'Euro', icon: 'currency-eur' },
  { type: 'btc' as const, label: 'Bitcoin', icon: 'bitcoin' },
  { type: 'eth' as const, label: 'Ethereum', icon: 'ethereum' },
  { type: 'other' as const, label: 'Diğer', icon: 'wallet' },
];

export default function InvestmentScreen() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<string>('gold');
  const [newAmount, setNewAmount] = useState('');
  const [newCost, setNewCost] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [p, i] = await Promise.all([fetchMarketPrices(), loadInvestments()]);
    setPrices(p);
    setInvestments(i);
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const totalCost = investments.reduce((s, v) => s + v.cost, 0);
  let totalValue = 0;
  investments.forEach(inv => {
    const p = prices.find(x => inv.type === 'gold' ? x.symbol === 'GA' : x.symbol.toUpperCase() === inv.type.toUpperCase());
    if (p) totalValue += inv.amount * p.sell;
    else totalValue += inv.cost;
  });
  const change = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const handleAdd = async () => {
    const amt = parseFloat(newAmount);
    const cst = parseFloat(newCost);
    if (!amt || !cst) { Alert.alert('Hata', 'Miktar ve maliyet gerekli.'); return; }
    const t = investmentTypes.find(x => x.type === newType);
    const newInv: Investment = {
      id: Date.now().toString(),
      type: newType as any,
      label: t?.label || newType,
      amount: amt,
      cost: cst,
      date: new Date().toISOString(),
    };
    const updated = [...investments, newInv];
    await saveInvestments(updated);
    setInvestments(updated);
    setShowAddModal(false);
    setNewAmount('');
    setNewCost('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu yatırımı silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        const updated = investments.filter(v => v.id !== id);
        await saveInvestments(updated);
        setInvestments(updated);
      }},
    ]);
  };

  const getPrice = (type: string) => prices.find(x => type === 'gold' ? x.symbol === 'GA' : x.symbol.toUpperCase() === type.toUpperCase());

  const invFormatted = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <SafeAreaView className="flex-1 bg-[#f2f5f9]" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-3 pb-2">
          <Text className="text-[#151c27] text-2xl font-bold">Yatırımlar</Text>
        </View>

        {/* Canlı Fiyatlar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-4" contentContainerStyle={{ gap: 10 }}>
          {prices.map(p => (
            <View key={p.symbol} className="bg-white rounded-2xl px-4 py-3 border border-[#e8ecf4] min-w-[130px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
              <View className="flex-row items-center gap-2 mb-1">
                <MaterialCommunityIcons name={p.icon as any} size={16} color="#0058bc" />
                <Text className="text-[#727786] text-xs font-medium">{p.symbol}</Text>
              </View>
              <Text className="text-[#151c27] font-bold text-base">{invFormatted(p.sell)} ₺</Text>
              <Text className="text-[#9ca3af] text-[10px]">Alış {invFormatted(p.buy)} ₺</Text>
            </View>
          ))}
        </ScrollView>

        {/* Özet Kartı */}
        <View className="mx-5 bg-white rounded-3xl p-5 mb-5 border border-[#e8ecf4]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#151c27] font-bold text-lg">Yatırımlarım</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} className="bg-[#0058bc] rounded-xl px-4 py-2 flex-row items-center gap-1">
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text className="text-white font-semibold text-xs">Ekle</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#0058bc" />
          ) : investments.length === 0 ? (
            <View className="items-center py-6">
              <MaterialCommunityIcons name="chart-timeline-variant" size={40} color="#c1c6d7" />
              <Text className="text-[#9ca3af] text-sm mt-2">Henüz yatırım eklemedin</Text>
            </View>
          ) : (
            <>
              <View className="flex-row justify-between mb-3">
                <View>
                  <Text className="text-[#9ca3af] text-xs">Toplam Maliyet</Text>
                  <Text className="text-[#151c27] font-bold text-lg">{invFormatted(totalCost)} ₺</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#9ca3af] text-xs">Güncel Değer</Text>
                  <Text className="text-[#151c27] font-bold text-lg">{invFormatted(totalValue)} ₺</Text>
                </View>
              </View>
              <View className={`self-start rounded-full px-3 py-1 flex-row items-center gap-1 ${change >= 0 ? 'bg-[#eafff0]' : 'bg-[#ffebe9]'}`}>
                <MaterialCommunityIcons name={change >= 0 ? 'trending-up' : 'trending-down'} size={14} color={change >= 0 ? '#10b981' : '#ba1a1a'} />
                <Text className={`font-semibold text-xs ${change >= 0 ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </Text>
              </View>

              {/* Yatırım Listesi */}
              <View className="mt-4 border-t border-[#e8ecf4] pt-3">
                {investments.map(inv => {
                  const p = getPrice(inv.type);
                  const currentVal = p ? inv.amount * p.sell : inv.cost;
                  const profit = currentVal - inv.cost;
                  return (
                    <TouchableOpacity key={inv.id} onLongPress={() => handleDelete(inv.id)} className="flex-row items-center py-3 border-b border-[#f2f5f9]">
                      <View className="w-9 h-9 rounded-full bg-[#f0f7ff] items-center justify-center mr-3">
                        <MaterialCommunityIcons name={(investmentTypes.find(t => t.type === inv.type)?.icon || 'wallet') as any} size={16} color="#0058bc" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#151c27] font-semibold text-sm">{inv.label}</Text>
                        <Text className="text-[#9ca3af] text-xs">{inv.amount} {inv.type === 'gold' ? 'gram' : inv.type === 'btc' || inv.type === 'eth' ? 'adet' : 'birim'}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[#151c27] font-semibold text-sm">{invFormatted(currentVal)} ₺</Text>
                        <Text className={`text-xs font-medium ${profit >= 0 ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>
                          {profit >= 0 ? '+' : ''}{invFormatted(profit)} ₺
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <Text className="text-center text-[#c1c6d7] text-xs">30 sn'de bir güncellenir</Text>
      </ScrollView>

      {/* Ekle Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowAddModal(false)}>
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl p-5 border-t border-[#e8ecf4]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 }}>
            <Text className="text-[#151c27] font-bold text-lg mb-4">Yatırım Ekle</Text>

            <Text className="text-[#727786] text-xs font-semibold mb-2">Tür</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {investmentTypes.map(t => (
                <TouchableOpacity key={t.type} onPress={() => setNewType(t.type)}
                  className={`px-4 py-2 rounded-xl border ${newType === t.type ? 'bg-[#0058bc] border-[#0058bc]' : 'bg-white border-[#e8ecf4]'}`}
                >
                  <Text className={`text-sm font-medium ${newType === t.type ? 'text-white' : 'text-[#151c27]'}`}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              className="bg-[#f8f9fc] rounded-xl px-4 py-3 text-base text-[#151c27] mb-3 border border-[#e8ecf4]"
              placeholder="Miktar (ör: 5 gram, 100 adet)"
              placeholderTextColor="#b0b7c3"
              keyboardType="decimal-pad"
              value={newAmount}
              onChangeText={setNewAmount}
            />
            <TextInput
              className="bg-[#f8f9fc] rounded-xl px-4 py-3 text-base text-[#151c27] mb-5 border border-[#e8ecf4]"
              placeholder="Toplam Maliyet (TL)"
              placeholderTextColor="#b0b7c3"
              keyboardType="decimal-pad"
              value={newCost}
              onChangeText={setNewCost}
            />

            <TouchableOpacity onPress={handleAdd} className="bg-[#0058bc] rounded-2xl py-3.5 items-center">
              <Text className="text-white font-bold text-base">Ekle</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
