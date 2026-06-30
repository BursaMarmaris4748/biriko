import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import StockIcon from '@/components/stock-icon';
import { fetchStockPrices, StockHolding, StockPrice } from '@/services/market-data';

const BIST_SYMBOLS = [
  'THYAO','GARAN','AKBNK','EREGL','TUPRS','ASELS','KCHOL','SAHOL','FROTO','SISE',
  'PGSUS','HEKTS','BIMAS','TCELL','VAKBN','YKBNK','ISCTR','SOKM','MGROS','KOZAA',
  'AEFES','VESTL','TOASO','OTKAR','ENKAI','TAVHL','TTKOM','PETKM','SASTAS','ECILC',
];

const US_SYMBOLS = [
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','JPM','V','SPY',
  'QQQ','AMD','NFLX','DIS','KO','PEP','WMT','JNJ','PG','BAC',
  'MA','UNH','HD','INTC','CSCO','PFE','NKE','VZ','T','BA',
];

const exchangeConfig: Record<string, { title: string; color: string; accent: string; symbols: string[] }> = {
  BIST: { title: 'Borsa İstanbul', color: '#E11D48', accent: '#FCE8ED', symbols: BIST_SYMBOLS },
  US: { title: 'ABD Borsaları', color: '#2563EB', accent: '#DBEAFE', symbols: US_SYMBOLS },
};

type StockListPrice = StockPrice & { symbol: string };

export default function StockListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { exchange = 'BIST' } = useLocalSearchParams<{ exchange: string }>();
  const cfg = exchangeConfig[exchange] || exchangeConfig.BIST;
  const [prices, setPrices] = useState<StockListPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const holdings: StockHolding[] = cfg.symbols.map(s => ({
      id: s, symbol: s, exchange: exchange as 'BIST' | 'US',
      shares: 0, costPerShare: 0, date: '',
    }));
    setLoading(true);
    fetchStockPrices(holdings).then(sp => {
      setPrices(sp.filter(p => p.price > 0));
      setLoading(false);
    });
  }, [exchange]);

  const filtered = prices.filter(p => {
    if (!search.trim()) return true;
    const q = search.toUpperCase();
    return p.symbol.includes(q) || p.name.toUpperCase().includes(q);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-3 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View className="flex-row items-center flex-1 gap-2">
          <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: cfg.accent }}>
            <MaterialCommunityIcons name="chart-line" size={18} color={cfg.color} />
          </View>
          <Text style={{ color: colors.text }} className="text-xl font-bold">{cfg.title}</Text>
        </View>
      </View>

      {/* Search */}
      <View className="mx-5 mb-3 flex-row items-center rounded-xl px-4 border" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, height: 44 }}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.text3} />
        <TextInput className="flex-1 ml-2 text-sm" placeholder="Hisse ara..." placeholderTextColor={colors.text3} value={search} onChangeText={setSearch} autoCapitalize="characters" style={{ color: colors.text }} />
      </View>

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color={cfg.color} /></View>
      ) : (
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: colors.text2 }} className="text-xs font-semibold mb-2">{filtered.length} hisse</Text>
          {filtered.map((p, i) => {
            const up = p.changePercent >= 0;
            return (
              <TouchableOpacity key={p.symbol} onPress={() => router.push({ pathname: '/stock-detail', params: { symbol: p.symbol, exchange } })}
                className={`flex-row items-center px-4 py-3.5 ${i === 0 ? 'rounded-t-xl' : ''} ${i === filtered.length - 1 ? 'rounded-b-xl' : ''}`}
                style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.shimmer, shadowColor: i === 0 ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: i === 0 ? 1 : 0 }}
              >
                <StockIcon symbol={p.symbol} name={p.name} size={36} />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ color: colors.text }} className="font-bold text-sm">{p.symbol}</Text>
                    <Text style={{ color: colors.text3 }} className="text-[10px] flex-shrink" numberOfLines={1}>{p.name}</Text>
                  </View>
                </View>
                <View className="items-end mr-2">
                  <Text style={{ color: colors.text }} className="font-bold text-sm">{p.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {p.currency}</Text>
                  <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? '#10b981' : '#ba1a1a'} />
                    <Text className={`text-xs font-bold ${up ? 'text-[#10b981]' : 'text-[#ba1a1a]'}`}>{up ? '+' : ''}{p.changePercent.toFixed(2)}%</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.text3} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
