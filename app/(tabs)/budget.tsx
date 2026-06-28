import React, { useEffect, useState, useCallback, useRef } from 'react';
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

const typeIconMap: Record<string, string> = {
  gold: 'gold',
  usd: 'currency-usd',
  eur: 'currency-eur',
  btc: 'bitcoin',
  eth: 'ethereum',
};

const typeColors: Record<string, string> = {
  gold: '#FFB300',
  usd: '#10B981',
  eur: '#0055FF',
  btc: '#F7931A',
  eth: '#8B5CF6',
  other: '#6B7280',
};

export default function InvestmentScreen() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<string>('gold');
  const [newAmount, setNewAmount] = useState('');
  const [newCost, setNewCost] = useState('');
  const costManuallyEdited = useRef(false);

  const currentUnitPrice = (() => {
    const match = newType === 'gold' ? 'GA' : newType.toUpperCase();
    const p = prices.find(x => x.symbol === match);
    return p?.sell || 0;
  })();

  const updateCostFromAmount = (amt: string, type: string) => {
    if (costManuallyEdited.current) return;
    const parsed = parseFloat(amt);
    if (!parsed) { setNewCost(''); return; }
    const match = type === 'gold' ? 'GA' : type.toUpperCase();
    const p = prices.find(x => x.symbol === match);
    if (p) setNewCost((parsed * p.sell).toFixed(2));
  };

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
    if (!amt) { Alert.alert('Hata', 'Miktar gerekli.'); return; }
    const cst = parseFloat(newCost) || (currentUnitPrice * amt);
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
    costManuallyEdited.current = false;
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
          {prices.map(p => {
            const up = p.change >= 0;
            return (
              <View key={p.symbol} className="bg-white rounded-2xl px-4 py-3 border border-[#e8ecf4] min-w-[135px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
                <View className="flex-row items-center gap-2 mb-1">
                  <MaterialCommunityIcons name={p.icon as any} size={16} color="#0058bc" />
                  <Text className="text-[#727786] text-xs font-medium">{p.symbol}</Text>
                </View>
                <Text className="text-[#151c27] font-bold text-base">{invFormatted(p.sell)} ₺</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <MaterialCommunityIcons name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? '#10b981' : '#ba1a1a'} />
                  <Text className={`text-xs font-semibold ${up ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>
                    {up ? '+' : ''}{p.change.toFixed(2)}%
                  </Text>
                  <Text className="text-[#9ca3af] text-[10px] ml-1">Alış {invFormatted(p.buy)} ₺</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Mavi Yatırımlarım Kartı */}
        <View className="mx-5 rounded-2xl p-5 mb-4" style={{ backgroundColor: '#0055FF' }}>
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-lg font-semibold">Yatırımlarım</Text>
              <MaterialCommunityIcons name="eye-outline" size={20} color="rgba(255,255,255,0.7)" />
            </View>
            <TouchableOpacity onPress={() => setShowAddModal(true)} className="bg-white rounded-xl px-4 py-2.5 flex-row items-center gap-1">
              <MaterialCommunityIcons name="plus" size={16} color="#0055FF" />
              <Text className="text-[#0055FF] font-bold text-xs">Ekle</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-white/70 text-xs">Toplam Maliyet</Text>
                <Text className="text-white font-bold text-2xl mt-1">{invFormatted(totalCost)} ₺</Text>
                <View className="bg-green-300/30 rounded-md px-2 py-1 mt-1.5 self-start">
                  <Text className="text-green-300 text-xs font-bold">{change >= 0 ? '+' : ''}{change.toFixed(2)}%</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-white/70 text-xs">Güncel Değer</Text>
                <Text className="text-white font-bold text-[28px] mt-1">{invFormatted(totalValue)} ₺</Text>
              </View>
            </View>
          )}
        </View>

        {/* Yatırım Listesi */}
        {investments.map(inv => {
          const p = getPrice(inv.type);
          const currentVal = p ? inv.amount * p.sell : inv.cost;
          const profit = currentVal - inv.cost;
          const icon = typeIconMap[inv.type] || 'wallet';
          const cardColor = typeColors[inv.type] || '#0055FF';
          const birim = inv.type === 'gold' ? 'gram' : inv.type === 'btc' || inv.type === 'eth' ? 'adet' : 'birim';
          return (
            <TouchableOpacity key={inv.id} onLongPress={() => handleDelete(inv.id)} activeOpacity={0.7}
              className="mx-5 rounded-2xl px-4 py-4 mb-3 flex-row items-center"
              style={{ backgroundColor: cardColor, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}
            >
              <View className="w-11 h-11 rounded-full bg-white/25 items-center justify-center mr-3">
                <MaterialCommunityIcons name={icon as any} size={22} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{inv.label}</Text>
                <Text className="text-white/70 text-xs">{inv.amount} {birim}</Text>
              </View>
              <View className="items-end mr-2">
                <Text className="text-white font-bold text-base">{invFormatted(currentVal)} ₺</Text>
                <Text className="text-sm font-bold text-white/80">
                  {profit >= 0 ? '+' : ''}{invFormatted(profit)} ₺
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          );
        })}

        {!loading && investments.length === 0 && (
          <View className="items-center py-10 mx-5 bg-white rounded-2xl border border-[#e8ecf4]">
            <MaterialCommunityIcons name="chart-timeline-variant" size={48} color="#c1c6d7" />
            <Text className="text-[#9ca3af] text-sm mt-3">Henüz yatırım eklemedin</Text>
          </View>
        )}

        <Text className="text-center text-[#c1c6d7] text-xs mt-4">30 sn'de bir güncellenir</Text>
      </ScrollView>

      {/* Ekle Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowAddModal(false)}>
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl p-5 border-t border-[#e8ecf4]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 }}>
            <Text className="text-[#151c27] font-bold text-lg mb-4">Yatırım Ekle</Text>

            <Text className="text-[#727786] text-xs font-semibold mb-2">Tür</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {investmentTypes.map(t => (
                <TouchableOpacity key={t.type} onPress={() => { setNewType(t.type); costManuallyEdited.current = false; updateCostFromAmount(newAmount, t.type); }}
                  className={`px-4 py-2 rounded-xl border ${newType === t.type ? 'bg-[#0055FF] border-[#0055FF]' : 'bg-white border-[#e8ecf4]'}`}
                >
                  <Text className={`text-sm font-medium ${newType === t.type ? 'text-white' : 'text-[#151c27]'}`}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentUnitPrice > 0 && (
              <View className="bg-[#f0f7ff] rounded-xl px-4 py-2 mb-3 flex-row items-center justify-between">
                <Text className="text-[#0055FF] text-xs font-medium">Güncel Birim Fiyat</Text>
                <Text className="text-[#0055FF] font-bold">{currentUnitPrice.toFixed(2)} ₺</Text>
              </View>
            )}
            <TextInput
              className="bg-[#f8f9fc] rounded-xl px-4 py-3 text-base text-[#151c27] mb-3 border border-[#e8ecf4]"
              placeholder="Miktar (ör: 10 gram, 100 adet)"
              placeholderTextColor="#b0b7c3"
              keyboardType="decimal-pad"
              value={newAmount}
              onChangeText={(t) => { setNewAmount(t); updateCostFromAmount(t, newType); }}
            />
            <TextInput
              className="bg-[#f8f9fc] rounded-xl px-4 py-3 text-base text-[#151c27] mb-5 border border-[#e8ecf4]"
              placeholder="Toplam Maliyet (TL) — otomatik hesaplanır"
              placeholderTextColor="#b0b7c3"
              keyboardType="decimal-pad"
              value={newCost}
              onChangeText={(t) => { costManuallyEdited.current = true; setNewCost(t); }}
            />

            <TouchableOpacity onPress={handleAdd} className="bg-[#0055FF] rounded-2xl py-3.5 items-center">
              <Text className="text-white font-bold text-base">Ekle</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
