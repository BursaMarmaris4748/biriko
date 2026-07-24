import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import Sparkline from '@/components/sparkline';
import StockIcon from '@/components/stock-icon';
import {
  MarketPrice, Investment, StockHolding, StockPrice,
  fetchMarketPrices, loadInvestments, saveInvestments,
  fetchStockPrices, loadStocks, saveStocks,
} from '@/services/market-data';

const investmentTypes = [
  { type: 'gold' as const, label: 'Gram Altın', icon: 'gold' },
  { type: 'usd' as const, label: 'Dolar', icon: 'currency-usd' },
  { type: 'eur' as const, label: 'Euro', icon: 'currency-eur' },
  { type: 'btc' as const, label: 'Bitcoin', icon: 'bitcoin' },
  { type: 'eth' as const, label: 'Ethereum', icon: 'ethereum' },
  { type: 'other' as const, label: 'Diğer', icon: 'wallet' },
];

const typeIconMap: Record<string, string> = {
  gold: 'gold', usd: 'currency-usd', eur: 'currency-eur', btc: 'bitcoin', eth: 'ethereum',
};

const currencyColors: Record<string, string> = {
  USD: '#10B981', EUR: '#0055FF', GA: '#FFB300', BTC: '#F7931A', ETH: '#8B5CF6',
};

const typeGradients: Record<string, [string, string]> = {
  gold: ['#FFD54F', '#FFB300'], usd: ['#6EE7B7', '#10B981'],
  eur: ['#60A5FA', '#0055FF'], btc: ['#FCD34D', '#F7931A'],
  eth: ['#C4B5FD', '#8B5CF6'], other: ['#9CA3AF', '#6B7280'],
};

const stockExchangeColors: Record<string, string> = { BIST: '#E11D48', US: '#2563EB' };

export default function InvestmentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<string>('gold');
  const [newAmount, setNewAmount] = useState('');
  const [newCost, setNewCost] = useState('');
  const costManuallyEdited = useRef(false);

  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [stockPrices, setStockPrices] = useState<StockPrice[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [showStockAddModal, setShowStockAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newExchange, setNewExchange] = useState<'BIST' | 'US'>('BIST');
  const [newShares, setNewShares] = useState('');
  const [newCostPerShare, setNewCostPerShare] = useState('');

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

  const loadStk = useCallback(async () => {
    const h = await loadStocks();
    setStocks(h);
    if (h.length) {
      setStockLoading(true);
      const sp = await fetchStockPrices(h);
      setStockPrices(sp);
      setStockLoading(false);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  useEffect(() => { loadStk(); const t = setInterval(loadStk, 30000); return () => clearInterval(t); }, [loadStk]);

  const totalCost = investments.reduce((s, v) => s + v.cost, 0);
  let totalValue = 0;
  investments.forEach(inv => {
    const p = prices.find(x => inv.type === 'gold' ? x.symbol === 'GA' : x.symbol.toUpperCase() === inv.type.toUpperCase());
    if (p) totalValue += inv.amount * p.sell;
    else totalValue += inv.cost;
  });
  const change = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  let stockTotalCost = 0;
  let stockTotalValue = 0;
  stocks.forEach(s => {
    const sp = stockPrices.find(p => p.symbol === s.symbol);
    stockTotalCost += s.shares * s.costPerShare;
    stockTotalValue += sp?.price ? s.shares * sp.price : s.shares * s.costPerShare;
  });

  const handleAdd = async () => {
    const amt = parseFloat(newAmount);
    if (!amt) { Alert.alert('Hata', 'Miktar gerekli.'); return; }
    const cst = parseFloat(newCost) || (currentUnitPrice * amt);
    const t = investmentTypes.find(x => x.type === newType);
    const newInv: Investment = {
      id: Date.now().toString(),
      type: newType as any,
      label: t?.label || newType,
      amount: amt, cost: cst,
      date: new Date().toISOString(),
    };
    const updated = [...investments, newInv];
    await saveInvestments(updated);
    setInvestments(updated);
    setShowAddModal(false);
    setNewAmount(''); setNewCost('');
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

  const handleStockAdd = async () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) { Alert.alert('Hata', 'Hisse sembolü gerekli.'); return; }
    const shares = parseFloat(newShares);
    if (!shares) { Alert.alert('Hata', 'Adet gerekli.'); return; }
    const cps = parseFloat(newCostPerShare);
    if (!cps) { Alert.alert('Hata', 'Birim maliyet gerekli.'); return; }
    const newHolding: StockHolding = {
      id: Date.now().toString(),
      symbol: sym,
      exchange: newExchange,
      shares,
      costPerShare: cps,
      date: new Date().toISOString(),
    };
    const updated = [...stocks, newHolding];
    await saveStocks(updated);
    setStocks(updated);
    fetchStockPrices(updated).then(setStockPrices);
    setShowStockAddModal(false);
    setNewSymbol(''); setNewShares(''); setNewCostPerShare('');
  };

  const handleStockDelete = (id: string) => {
    Alert.alert('Sil', 'Bu hisseyi silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        const updated = stocks.filter(v => v.id !== id);
        await saveStocks(updated);
        setStocks(updated);
      }},
    ]);
  };

  const getPrice = (type: string) => prices.find(x => type === 'gold' ? x.symbol === 'GA' : x.symbol.toUpperCase() === type.toUpperCase());
  const invFormatted = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const stockCard = (sp: StockPrice, exchange: 'BIST' | 'US') => {
    const up = sp.changePercent >= 0;
    const exColor = stockExchangeColors[exchange];
    const holding = stocks.find(s => s.symbol === sp.symbol && s.exchange === exchange);
    if (!holding) return null;
    const curVal = sp.price * holding.shares;
    const profit = curVal - (holding.shares * holding.costPerShare);
    return (
      <TouchableOpacity key={`stock-${holding.id}`} onLongPress={() => handleStockDelete(holding.id)} activeOpacity={0.85}
        className="bg-white rounded-2xl px-4 pt-3 pb-3 border border-[#e8ecf4] min-w-[170px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
      >
        <View className="flex-row items-center gap-2 mb-1">
          <MaterialCommunityIcons name="chart-line" size={16} color={exColor} />
          <Text className="text-xs font-bold" style={{ color: exColor }}>{sp.symbol}</Text>
          <View className="bg-gray-100 rounded px-1.5 py-0.5"><Text className="text-[10px] font-bold text-[#727786]">{exchange}</Text></View>
        </View>
        {sp.price > 0 ? (
          <>
            <Text className="text-[#151c27] font-bold text-base">{sp.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sp.currency}</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <MaterialCommunityIcons name={up ? 'trending-up' : 'trending-down'} size={13} color={up ? '#10b981' : '#ba1a1a'} />
              <Text className={`text-xs font-bold ${up ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>{up ? '+' : ''}{sp.changePercent.toFixed(2)}%</Text>
              <Text className="text-[#9ca3af] text-[10px] ml-1">{sp.name}</Text>
            </View>
            <View className="mt-2 pt-2 border-t border-[#f0f2f5] flex-row justify-between">
              <Text className="text-[#151c27] font-bold text-xs">{holding.shares} adet</Text>
              <Text className={`text-xs font-bold ${profit >= 0 ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>{profit >= 0 ? '+' : ''}{invFormatted(profit)} ₺</Text>
            </View>
          </>
        ) : (
          <View className="py-2"><Text className="text-[#9ca3af] text-xs italic">Fiyat bekleniyor...</Text></View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-3 pb-2">
          <Text style={{ color: colors.text }} className="text-2xl font-bold">Yatırımlar</Text>
        </View>

        {/* Canlı Fiyatlar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-4" contentContainerStyle={{ gap: 10 }}>
          {prices.map(p => {
            const up = p.change >= 0;
            const curColor = currencyColors[p.symbol] || '#0058bc';
            return (
              <View key={p.symbol} style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }} className="rounded-2xl px-4 pt-3 pb-2 border min-w-[155px]">
                <View className="flex-row items-center gap-2 mb-1">
                  <MaterialCommunityIcons name={p.icon as any} size={18} color={curColor} />
                  <Text className="text-xs font-semibold" style={{ color: curColor }}>{p.symbol}</Text>
                </View>
                <Text style={{ color: colors.text }} className="font-bold text-lg">{invFormatted(p.sell)} ₺</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <MaterialCommunityIcons name={up ? 'trending-up' : 'trending-down'} size={14} color={up ? '#10b981' : '#ba1a1a'} />
                  <Text className={`text-sm font-bold ${up ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>{up ? '+' : ''}{p.change.toFixed(2)}%</Text>
                </View>
                <Text className="text-[#9ca3af] text-[10px] mt-0.5">Günlük değişim</Text>
                <View className="mt-1 items-center"><Sparkline data={p.history} color={up ? '#10B981' : '#BA1A1A'} width={140} height={36} /></View>
              </View>
            );
          })}
        </ScrollView>

        {/* Hisse Senetleri Borsa İstanbul */}
        {stocks.filter(s => s.exchange === 'BIST').length > 0 && (
          <>
            <TouchableOpacity onPress={() => router.push('/stock-list?exchange=BIST')} className="flex-row items-center justify-between px-5 mb-2">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="chart-line" size={18} color="#E11D48" />
                <Text className="text-[#151c27] font-bold text-base">Borsa İstanbul</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="plus-circle" size={18} color="#E11D48" />
                <Text className="text-[#E11D48] font-bold text-xs">Piyasayı Keşfet</Text>
              </View>
            </TouchableOpacity>
            {stockLoading && stocks.filter(s => s.exchange === 'BIST').length > 0 ? (
              <ActivityIndicator size="small" color="#E11D48" className="py-4" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-4" contentContainerStyle={{ gap: 10 }}>
                {stockPrices.filter(sp => stocks.some(s => s.symbol === sp.symbol && s.exchange === 'BIST')).map(sp => {
                  const h = stocks.find(s => s.symbol === sp.symbol && s.exchange === 'BIST');
                  return (
                    <TouchableOpacity key={`bist-${h?.id || sp.symbol}`} onPress={() => router.push({ pathname: '/stock-detail', params: { symbol: sp.symbol, exchange: 'BIST' } })} onLongPress={() => h && handleStockDelete(h.id)} activeOpacity={0.85}
                      className="rounded-2xl px-4 pt-3 pb-3 border min-w-[165px]" style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
                    >
                      <View className="flex-row items-center gap-2 mb-2">
                        <StockIcon symbol={sp.symbol} name={sp.name} size={28} />
                        <Text className="text-xs font-bold text-[#E11D48]">{sp.symbol}</Text>
                      </View>
                      {sp.price > 0 ? (
                        <>
                          <Text style={{ color: colors.text }} className="font-bold text-base mb-1">{sp.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</Text>
                          <View className="flex-row items-center gap-1">
                            <MaterialCommunityIcons name={sp.changePercent >= 0 ? 'trending-up' : 'trending-down'} size={13} color={sp.changePercent >= 0 ? '#10b981' : '#ba1a1a'} />
                            <Text className={`text-xs font-bold ${sp.changePercent >= 0 ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>{sp.changePercent >= 0 ? '+' : ''}{sp.changePercent.toFixed(2)}%</Text>
                            {h && <Text className="text-[#9ca3af] text-[10px] ml-auto">{h.shares} ad</Text>}
                          </View>
                        </>
                      ) : <Text className="text-[#9ca3af] text-xs italic py-2">Yükleniyor...</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}

        {/* Hisse Senetleri ABD */}
        {stocks.filter(s => s.exchange === 'US').length > 0 && (
          <>
            <TouchableOpacity onPress={() => router.push('/stock-list?exchange=US')} className="flex-row items-center justify-between px-5 mb-2">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="chart-line" size={18} color="#2563EB" />
                <Text className="text-[#151c27] font-bold text-base">ABD Borsaları</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="plus-circle" size={18} color="#2563EB" />
                <Text className="text-[#2563EB] font-bold text-xs">Piyasayı Keşfet</Text>
              </View>
            </TouchableOpacity>
            {stockLoading && stocks.filter(s => s.exchange === 'US').length > 0 ? (
              <ActivityIndicator size="small" color="#2563EB" className="py-4" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-4" contentContainerStyle={{ gap: 10 }}>
                {stockPrices.filter(sp => stocks.some(s => s.symbol === sp.symbol && s.exchange === 'US')).map(sp => {
                  const h = stocks.find(s => s.symbol === sp.symbol && s.exchange === 'US');
                  return (
                    <TouchableOpacity key={`us-${h?.id || sp.symbol}`} onPress={() => router.push({ pathname: '/stock-detail', params: { symbol: sp.symbol, exchange: 'US' } })} onLongPress={() => h && handleStockDelete(h.id)} activeOpacity={0.85}
                      className="rounded-2xl px-4 pt-3 pb-3 border min-w-[165px]" style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
                    >
                      <View className="flex-row items-center gap-2 mb-2">
                        <StockIcon symbol={sp.symbol} name={sp.name} size={28} />
                        <Text className="text-xs font-bold text-[#2563EB]">{sp.symbol}</Text>
                      </View>
                      {sp.price > 0 ? (
                        <>
                          <Text style={{ color: colors.text }} className="font-bold text-base mb-1">{sp.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sp.currency}</Text>
                          <View className="flex-row items-center gap-1">
                            <MaterialCommunityIcons name={sp.changePercent >= 0 ? 'trending-up' : 'trending-down'} size={13} color={sp.changePercent >= 0 ? '#10b981' : '#ba1a1a'} />
                            <Text className={`text-xs font-bold ${sp.changePercent >= 0 ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>{sp.changePercent >= 0 ? '+' : ''}{sp.changePercent.toFixed(2)}%</Text>
                            {h && <Text className="text-[#9ca3af] text-[10px] ml-auto">{h.shares} ad</Text>}
                          </View>
                        </>
                      ) : <Text className="text-[#9ca3af] text-xs italic py-2">Yükleniyor...</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}

        {/* Hisse Eklenmemişse Keşfet Butonu */}
        {stocks.length === 0 && (
          <View className="mx-5 mb-4">
            <Text style={{ color: colors.text2 }} className="text-xs font-semibold mb-2 ml-1">HİSSE SENETLERİ</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => router.push('/stock-list?exchange=BIST')}
                className="flex-1 rounded-2xl p-4 border items-center" style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
              >
                <MaterialCommunityIcons name="chart-line" size={32} color="#E11D48" />
                <Text style={{ color: colors.text }} className="font-bold text-sm mt-2">Borsa İstanbul</Text>
                <Text style={{ color: colors.text3 }} className="text-[11px] mt-1">Hisseleri keşfet</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/stock-list?exchange=US')}
                className="flex-1 rounded-2xl p-4 border items-center" style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
              >
                <MaterialCommunityIcons name="chart-line" size={32} color="#2563EB" />
                <Text style={{ color: colors.text }} className="font-bold text-sm mt-2">ABD Borsaları</Text>
                <Text style={{ color: colors.text3 }} className="text-[11px] mt-1">NASDAQ, NYSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mavi Yatırımlarım Kartı */}
        <View className="mx-5 rounded-2xl mb-4 overflow-hidden">
          <LinearGradient colors={['#4F7FFF', '#0033CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-5">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-lg font-semibold">Döviz & Kripto</Text>
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
          </LinearGradient>
        </View>

        {/* Yatırım Listesi */}
        {investments.map(inv => {
          const p = getPrice(inv.type);
          const currentVal = p ? inv.amount * p.sell : inv.cost;
          const profit = currentVal - inv.cost;
          const icon = typeIconMap[inv.type] || 'wallet';
          const gradient = typeGradients[inv.type] || ['#60A5FA', '#0055FF'];
          const birim = inv.type === 'gold' ? 'gram' : inv.type === 'btc' || inv.type === 'eth' ? 'adet' : 'birim';
          return (
            <TouchableOpacity key={inv.id} onLongPress={() => handleDelete(inv.id)} activeOpacity={0.7}
              className="mx-5 rounded-2xl mb-3 overflow-hidden"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}
            >
              <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-row items-center px-4 py-4">
                <View className="w-11 h-11 rounded-full bg-white/25 items-center justify-center mr-3">
                  <MaterialCommunityIcons name={icon as any} size={22} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">{inv.label}</Text>
                  <Text className="text-white/70 text-xs">{inv.amount} {birim}</Text>
                </View>
                <View className="items-end mr-2">
                  <Text className="text-white font-bold text-base">{invFormatted(currentVal)} ₺</Text>
                  <Text className="text-sm font-bold text-white/80">{profit >= 0 ? '+' : ''}{invFormatted(profit)} ₺</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {!loading && investments.length === 0 && (
          <View className="items-center py-10 mx-5 rounded-2xl border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={48} color={colors.text3} />
            <Text style={{ color: colors.text3 }} className="text-sm mt-3">Henüz döviz/kripto eklemedin</Text>
          </View>
        )}

        {/* Hisse Portföy Özeti */}
        {(stockTotalCost > 0 || stockTotalValue > 0) && (
          <View className="mx-5 rounded-2xl mb-4 overflow-hidden">
            <LinearGradient colors={['#1E293B', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-4">
              <Text className="text-white/70 text-xs mb-1">Hisse Portföy Özeti</Text>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white/50 text-[10px]">Maliyet</Text>
                  <Text className="text-white font-bold text-lg">{invFormatted(stockTotalCost)} ₺</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/50 text-[10px]">Güncel Değer</Text>
                  <Text className="text-white font-bold text-lg">{invFormatted(stockTotalValue)} ₺</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/50 text-[10px]">Kâr/Zarar</Text>
                  <Text className={`font-bold text-lg ${stockTotalValue >= stockTotalCost ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>
                    {stockTotalValue >= stockTotalCost ? '+' : ''}{invFormatted(stockTotalValue - stockTotalCost)} ₺
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        <Text style={{ color: colors.text3, textAlign: 'center' }} className="text-xs mt-4">30 sn'de bir güncellenir</Text>
      </ScrollView>

      {/* Yatırım Ekle Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowAddModal(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 }} className="rounded-t-3xl p-5 border-t">
            <Text style={{ color: colors.text }} className="font-bold text-lg mb-4">Döviz / Kripto Ekle</Text>
            <Text style={{ color: colors.text2 }} className="text-xs font-semibold mb-2">Tür</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {investmentTypes.map(t => (
                <TouchableOpacity key={t.type} onPress={() => { setNewType(t.type); costManuallyEdited.current = false; updateCostFromAmount(newAmount, t.type); }}
                  className={`px-4 py-2 rounded-xl border ${newType === t.type ? 'border-[#0055FF]' : 'border-[#e8ecf4]'}`}
                  style={{ backgroundColor: newType === t.type ? colors.accent : colors.card, borderColor: newType === t.type ? colors.accent : colors.border }}
                >
                  <Text className={`text-sm font-medium ${newType === t.type ? 'text-white' : ''}`} style={{ color: newType === t.type ? '#fff' : colors.text }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {currentUnitPrice > 0 && (
              <View style={{ backgroundColor: colors.accentLight }} className="rounded-xl px-4 py-2 mb-3 flex-row items-center justify-between">
                <Text style={{ color: colors.accent }} className="text-xs font-medium">Güncel Birim Fiyat</Text>
                <Text style={{ color: colors.accent }} className="font-bold">{currentUnitPrice.toFixed(2)} ₺</Text>
              </View>
            )}
            <TextInput style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} className="rounded-xl px-4 py-3 text-base mb-3 border" placeholder="Miktar (ör: 10 gram, 100 adet)" placeholderTextColor={colors.text3} keyboardType="decimal-pad" value={newAmount} onChangeText={(t) => { setNewAmount(t); updateCostFromAmount(t, newType); }} />
            <TextInput style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} className="rounded-xl px-4 py-3 text-base mb-5 border" placeholder="Toplam Maliyet (TL) — otomatik hesaplanır" placeholderTextColor={colors.text3} keyboardType="decimal-pad" value={newCost} onChangeText={(t) => { costManuallyEdited.current = true; setNewCost(t); }} />
            <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: colors.accent }} className="rounded-2xl py-3.5 items-center"><Text className="text-white font-bold text-base">Ekle</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Hisse Ekle Modal */}
      <Modal visible={showStockAddModal} transparent animationType="slide" onRequestClose={() => setShowStockAddModal(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowStockAddModal(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 }} className="rounded-t-3xl p-5 border-t">
            <Text style={{ color: colors.text }} className="font-bold text-lg mb-4">Hisse Senedi Ekle</Text>
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity onPress={() => setNewExchange('BIST')}
                className="flex-1 py-3 rounded-xl items-center border"
                style={{ backgroundColor: newExchange === 'BIST' ? '#E11D48' : colors.card, borderColor: newExchange === 'BIST' ? '#E11D48' : colors.border }}
              ><Text className="font-bold text-sm" style={{ color: newExchange === 'BIST' ? '#fff' : colors.text }}>Borsa İstanbul</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setNewExchange('US')}
                className="flex-1 py-3 rounded-xl items-center border"
                style={{ backgroundColor: newExchange === 'US' ? '#2563EB' : colors.card, borderColor: newExchange === 'US' ? '#2563EB' : colors.border }}
              ><Text className="font-bold text-sm" style={{ color: newExchange === 'US' ? '#fff' : colors.text }}>ABD (NASDAQ)</Text></TouchableOpacity>
            </View>
            <Text style={{ color: colors.text2 }} className="text-xs font-semibold mb-2">Sembol</Text>
            <TextInput style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} className="rounded-xl px-4 py-3 text-base mb-3 border" placeholder={newExchange === 'BIST' ? 'Örn: THYAO, GARAN, ASELS' : 'Örn: AAPL, MSFT, NVDA'} placeholderTextColor={colors.text3} autoCapitalize="characters" value={newSymbol} onChangeText={setNewSymbol} />
            <TextInput style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} className="rounded-xl px-4 py-3 text-base mb-3 border" placeholder="Adet" placeholderTextColor={colors.text3} keyboardType="decimal-pad" value={newShares} onChangeText={setNewShares} />
            <TextInput style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} className="rounded-xl px-4 py-3 text-base mb-5 border" placeholder="Birim Maliyet (TL)" placeholderTextColor={colors.text3} keyboardType="decimal-pad" value={newCostPerShare} onChangeText={setNewCostPerShare} />
            <TouchableOpacity onPress={handleStockAdd} className="rounded-2xl py-3.5 items-center" style={{ backgroundColor: newExchange === 'BIST' ? '#E11D48' : '#2563EB' }}>
              <Text className="text-white font-bold text-base">Hisse Ekle</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
