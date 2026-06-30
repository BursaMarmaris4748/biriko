import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '@/contexts/theme-context';
import StockIcon from '@/components/stock-icon';
import { fetchStockHistory, fetchStockPrices, loadStocks, saveStocks, StockHolding } from '@/services/market-data';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 40;
const CHART_H = 220;

const timeframes = [
  { key: '1d', label: '1G' },
  { key: '5d', label: '1H' },
  { key: '1mo', label: '1A' },
  { key: '3mo', label: '6A' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
] as const;

type TimeframeKey = typeof timeframes[number]['key'];

function Chart({ data, color, textColor }: { data: number[]; color: string; textColor?: string }) {
  if (data.length < 2) {
    return <View className="items-center justify-center" style={{ width: CHART_W, height: CHART_H }}><Text style={{ color: textColor || '#9ca3af' }} className="text-sm">Grafik verisi yükleniyor...</Text></View>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = CHART_W / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${CHART_H - ((v - min) / range) * (CHART_H - 12) - 6}`).join(' ');
  return (
    <View className="items-center">
      <Svg width={CHART_W} height={CHART_H}>
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export default function StockDetailScreen() {
  const router = useRouter();
  const { symbol: rawSymbol, exchange: rawExchange } = useLocalSearchParams<{ symbol: string; exchange: string }>();
  const symbol = rawSymbol || '';
  const exchange = (rawExchange || 'BIST') as 'BIST' | 'US';
  const extSymbol = exchange === 'BIST' ? `${symbol}.IS` : symbol;

  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [currency, setCurrency] = useState('TRY');
  const [name, setName] = useState(symbol);
  const [history, setHistory] = useState<number[]>([]);
  const [high, setHigh] = useState(0);
  const [low, setLow] = useState(0);
  const [timeframe, setTimeframe] = useState<TimeframeKey>('1mo');
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const { colors } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [shares, setShares] = useState('');
  const [costPerShare, setCostPerShare] = useState('');

  const loadPrice = async () => {
    const holdings: StockHolding[] = [{ id: symbol, symbol, exchange, shares: 0, costPerShare: 0, date: '' }];
    const sp = await fetchStockPrices(holdings);
    if (sp[0]?.price > 0) {
      setPrice(sp[0].price);
      setChange(sp[0].change);
      setChangePercent(sp[0].changePercent);
      setCurrency(sp[0].currency || 'TRY');
      setName(sp[0].name || symbol);
    }
    setLoading(false);
  };

  const loadHistory = async (tf: TimeframeKey) => {
    setFetchingHistory(true);
    const data = await fetchStockHistory(extSymbol, tf);
    if (data.close.length > 0) {
      setHistory(data.close);
      const validHigh = data.high.filter((h): h is number => h !== null && h !== undefined);
      const validLow = data.low.filter((l): l is number => l !== null && l !== undefined);
      if (validHigh.length) setHigh(Math.max(...validHigh));
      if (validLow.length) setLow(Math.min(...validLow));
    } else if (data.timestamp.length > 0 && data.close.length === 0 && data.high.length > 0) {
      const validHigh = data.high.filter((h): h is number => h !== null && h !== undefined);
      const validLow = data.low.filter((l): l is number => l !== null && l !== undefined);
      if (validHigh.length) setHigh(Math.max(...validHigh));
      if (validLow.length) setLow(Math.min(...validLow));
    }
    setFetchingHistory(false);
  };

  useEffect(() => { loadPrice(); }, [symbol]);
  useEffect(() => { loadHistory(timeframe); }, [timeframe, symbol]);

  useEffect(() => {
    const t = setInterval(loadPrice, 30000);
    return () => clearInterval(t);
  }, [symbol]);

  const handleAddStock = async () => {
    const s = parseFloat(shares);
    const c = parseFloat(costPerShare);
    if (!s || !c) { Alert.alert('Hata', 'Adet ve birim maliyet gerekli.'); return; }
    const holdings = await loadStocks();
    const existing = holdings.find(h => h.symbol === symbol && h.exchange === exchange);
    if (existing) {
      Alert.alert('Uyarı', `${symbol} zaten portföyünde.`);
      return;
    }
    const newHolding: StockHolding = {
      id: Date.now().toString(), symbol, exchange,
      shares: s, costPerShare: c, date: new Date().toISOString(),
    };
    const updated = [...holdings, newHolding];
    await saveStocks(updated);
    Alert.alert('Eklendi', `${symbol} portföyüne eklendi.`, [
      { text: 'Tamam', onPress: () => router.back() }
    ]);
  };

  const up = changePercent >= 0;
  const exColor = exchange === 'BIST' ? '#E11D48' : '#2563EB';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-3 pb-3" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <StockIcon symbol={symbol} name={name} size={44} />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-[#151c27] text-xl font-bold">{symbol}</Text>
            <View className="rounded-lg px-2 py-0.5" style={{ backgroundColor: exColor + '20' }}>
              <Text className="font-bold text-xs" style={{ color: exColor }}>{exchange === 'BIST' ? 'BIST' : 'NASDAQ'}</Text>
            </View>
          </View>
          <Text className="text-[#727786] text-xs">{name}</Text>
          {loading ? (
            <ActivityIndicator size="small" color={exColor} style={{ marginTop: 4, alignSelf: 'flex-start' }} />
          ) : (
            <View className="flex-row items-center gap-3 mt-1">
              <Text className="text-[#151c27] text-2xl font-bold">
                {price > 0 ? `${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </Text>
              {price > 0 && (
                <View className={`flex-row items-center gap-1 px-2.5 py-0.5 rounded-full ${up ? 'bg-green-100' : 'bg-red-100'}`}>
                  <MaterialCommunityIcons name={up ? 'trending-up' : 'trending-down'} size={14} color={up ? '#10b981' : '#ba1a1a'} />
                  <Text className={`font-bold text-sm ${up ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>{up ? '+' : ''}{changePercent.toFixed(2)}%</Text>
                </View>
              )}
              <Text className="text-[#9ca3af] text-xs">{currency}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Grafik */}
        <View className="mx-5 rounded-2xl p-4 mb-3 border" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
          {/* Zaman Dilimleri */}
          <View className="flex-row gap-2 mb-3">
            {timeframes.map(tf => (
              <TouchableOpacity key={tf.key} onPress={() => setTimeframe(tf.key)}
                className={`px-3 py-1.5 rounded-lg ${timeframe === tf.key ? '' : 'bg-gray-100'}`}
                style={{ backgroundColor: timeframe === tf.key ? exColor : undefined }}
              >
                <Text className={`text-xs font-bold ${timeframe === tf.key ? 'text-white' : 'text-[#727786]'}`}>{tf.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {fetchingHistory ? (
            <View className="items-center justify-center" style={{ height: CHART_H }}><ActivityIndicator size="small" color={exColor} /></View>
          ) : (
            <Chart data={history} color={up ? '#10B981' : '#BA1A1A'} textColor={colors.text3} />
          )}
          {/* High / Low */}
          {(high > 0 || low > 0) && (
            <View className="flex-row justify-between mt-2">
              <View className="flex-row items-center gap-1"><Text className="text-[#10b981] text-xs font-bold">▲</Text><Text className="text-[#727786] text-[11px]">En Yüksek {high.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
              <View className="flex-row items-center gap-1"><Text className="text-[#ba1a1a] text-xs font-bold">▼</Text><Text className="text-[#727786] text-[11px]">En Düşük {low.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
            </View>
          )}
        </View>

        {/* Ekle Butonu */}
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}
          className="mx-5 rounded-2xl py-4 items-center mb-3"
          style={{ backgroundColor: exColor }}
        >
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#fff" />
            <Text className="text-white font-bold text-base">Yatırım Ekle</Text>
          </View>
        </TouchableOpacity>

        {/* Ekleme Formu */}
        {showAdd && (
          <View className="mx-5 rounded-2xl p-5 border mb-3" style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            {price > 0 && (
              <View className="rounded-xl px-4 py-2.5 mb-3 flex-row items-center justify-between" style={{ backgroundColor: colors.accentLight }}>
                <Text style={{ color: colors.accent }} className="text-xs font-medium">Güncel Fiyat</Text>
                <Text style={{ color: colors.accent }} className="font-bold">{price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</Text>
              </View>
            )}
            <TextInput style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} className="rounded-xl px-4 py-3 text-base mb-3 border" placeholder="Adet" placeholderTextColor={colors.text3} keyboardType="decimal-pad" value={shares} onChangeText={setShares} />
            <TextInput style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} className="rounded-xl px-4 py-3 text-base mb-4 border" placeholder={`Birim Maliyet (${currency === 'TRY' ? 'TL' : currency})`} placeholderTextColor={colors.text3} keyboardType="decimal-pad" value={costPerShare} onChangeText={setCostPerShare} />
            <TouchableOpacity onPress={handleAddStock} className="rounded-2xl py-3.5 items-center" style={{ backgroundColor: exColor }}>
              <Text className="text-white font-bold text-base">Portföye Ekle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Yardım */}
        <Text style={{ color: colors.text3, textAlign: 'center' }} className="text-xs mt-2">30 sn'de bir güncellenir • Hisseye uzun basarak portföyden silebilirsin</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
