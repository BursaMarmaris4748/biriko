import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinance } from '@/services/finance-context';
import { useAuth } from '@/services/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Group } from '@/lib/types';

const paraFormat = (sayi: number): string => {
  const negatif = sayi < 0;
  return (negatif ? '-₺' : '₺') + Math.abs(sayi).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const KATEGORI_RENK: Record<string, { bg: string; icon: string; text: string }> = {
  Market: { bg: '#ffdad6', icon: 'cart', text: '#93000a' },
  Fatura: { bg: '#ffedd5', icon: 'file-document', text: '#9a3412' },
  Kira: { bg: '#dbeafe', icon: 'home', text: '#1e40af' },
  Ulaşım: { bg: '#d1fae5', icon: 'bus', text: '#065f46' },
  Eğlence: { bg: '#f3e8ff', icon: 'movie-open', text: '#6b21a8' },
  Maaş: { bg: '#d1fae5', icon: 'briefcase', text: '#065f46' },
};

const varsayilanIkon = 'cash';

export const GelirGiderKarti: React.FC<{
  onGelirEkle: () => void;
  onGiderEkle: () => void;
  groups?: (Group & { unread?: number })[];
  groupsLoading?: boolean;
}> = ({ onGelirEkle, onGiderEkle, groups = [], groupsLoading = false }) => {
  const router = useRouter();
  const { transactions, totalGelir, totalGider, net, loading } = useFinance();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const kullaniciAdi = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  const oran = totalGelir > 0 ? Math.round((totalGider / totalGelir) * 100) : 0;

  const sonIslemler = transactions.slice(0, 5);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Profil Başlığı */}
      <View className="flex-row items-center justify-between px-4 pt-6 pb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-full bg-[#0058bc] items-center justify-center border-2 border-white shadow-sm">
            <Text className="text-white font-bold text-base">
              {kullaniciAdi.split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-xs font-medium" style={{ color: colors.text2 }}>Merhaba,</Text>
            <Text className="font-bold text-base" style={{ color: colors.text }}>{kullaniciAdi}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.push('/hamburger-menu' as any)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialCommunityIcons name="menu" size={20} color={colors.text2} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialCommunityIcons name="bell" size={20} color={colors.text2} />
            <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ana Bakiye Kartı */}
      <View className="mx-4 rounded-[24px] overflow-hidden mb-5"
        style={{ backgroundColor: '#0058bc' }}
      >
        <View className="p-6 relative">
          <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
          <View className="absolute -bottom-20 left-1/2 w-40 h-40 bg-white/5 rounded-full" />
          <View className="relative z-10">
            <Text className="text-[#adc6ff] text-sm font-semibold tracking-wider uppercase">Toplam Bakiye</Text>
            <Text className="text-white text-[40px] font-bold tracking-tight mt-1 mb-6">
              {paraFormat(net)}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onGelirEkle}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3.5"
                style={{ backgroundColor: '#4edea3' }}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color="#003823" />
                <Text className="text-[#003823] font-bold text-sm">Gelir Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onGiderEkle}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3.5"
                style={{ backgroundColor: '#ffb3ad' }}
              >
                <MaterialCommunityIcons name="minus-circle" size={20} color="#68000d" />
                <Text className="text-[#68000d] font-bold text-sm">Gider Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Gelir / Gider Özet Kartları */}
      <View className="flex-row gap-3 mx-4 mb-5">
        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: '#d1fae5' }}>
              <MaterialCommunityIcons name="arrow-down" size={16} color="#065f46" />
            </View>
            <Text className="text-xs font-bold tracking-wider uppercase" style={{ color: colors.text2 }}>Gelir</Text>
          </View>
          <Text className="text-[#065f46] font-bold text-xl">{paraFormat(totalGelir)}</Text>
        </View>
        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: '#ffdad6' }}>
              <MaterialCommunityIcons name="arrow-up" size={16} color="#93000a" />
            </View>
            <Text className="text-xs font-bold tracking-wider uppercase" style={{ color: colors.text2 }}>Gider</Text>
          </View>
          <Text className="text-[#93000a] font-bold text-xl">{paraFormat(totalGider)}</Text>
        </View>
      </View>

      {/* Harcama Oranı */}
      <View className="mx-4 mb-5 rounded-2xl p-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-semibold" style={{ color: colors.text2 }}>Harcama Oranı</Text>
          <Text className={`font-bold text-xs ${oran > 80 ? 'text-[#93000a]' : oran > 50 ? 'text-[#9a3412]' : 'text-[#065f46]'}`}>
            %{oran}
          </Text>
        </View>
        <View className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: colors.shimmer }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(oran, 100)}%`,
              backgroundColor: oran > 80 ? '#ba1a1a' : oran > 50 ? '#d97706' : '#10b981',
            }}
          />
        </View>
      </View>

      {/* Son İşlemler */}
      <View className="mx-4 mb-3">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="receipt-text" size={16} color={colors.accent} />
            <Text className="font-bold text-base" style={{ color: colors.text }}>Son İşlemler</Text>
          </View>
          <TouchableOpacity>
            <Text className="text-xs font-semibold" style={{ color: colors.accent }}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center py-6">
            <Text className="text-sm" style={{ color: colors.text2 }}>Yükleniyor...</Text>
          </View>
        ) : sonIslemler.length === 0 ? (
          <View className="items-center py-6 rounded-2xl" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialCommunityIcons name="receipt-text" size={32} color={colors.text3} />
            <Text className="text-sm mt-2" style={{ color: colors.text2 }}>Henüz işlem yok</Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.text3 }}>Gelir veya gider ekleyin</Text>
          </View>
        ) : (
          sonIslemler.map((islem) => {
            const renk = islem.type === 'gelir'
              ? { bg: '#d1fae5', text: '#065f46', prefix: '+' }
              : { bg: '#ffdad6', text: '#93000a', prefix: '-' };
            const kat = KATEGORI_RENK[islem.category] || { bg: '#f0f3ff', icon: 'cash', text: '#414754' };
            return (
              <View
                key={islem.id}
                className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: kat.bg }}>
                    <MaterialCommunityIcons name={(kat.icon || varsayilanIkon) as any} size={18} color={kat.text} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{islem.category}</Text>
                    <Text className="text-xs" style={{ color: colors.text2 }}>{islem.note || islem.date}</Text>
                  </View>
                </View>
                <Text className="font-bold text-sm" style={{ color: renk.text }}>
                  {renk.prefix}{islem.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Sohbetler */}
      <View className="mx-4 mb-5">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="forum" size={16} color={colors.accent} />
            <Text className="font-bold text-base" style={{ color: colors.text }}>Sohbetler</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/groups' as any)} className="flex-row items-center gap-1">
            <Text className="text-xs font-semibold" style={{ color: colors.accent }}>Tümü</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {groupsLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : groups.length === 0 ? (
          <TouchableOpacity onPress={() => router.push('/groups' as any)}
            className="items-center py-6 rounded-2xl border-2 border-dashed"
            style={{ borderColor: colors.border, backgroundColor: colors.card + '50' }}
          >
            <MaterialCommunityIcons name="forum-outline" size={28} color={colors.text3} />
            <Text className="text-sm mt-1" style={{ color: colors.text2 }}>Henüz grubun yok</Text>
            <Text className="text-xs font-semibold mt-0.5" style={{ color: colors.accent }}>Grup oluştur veya katıl</Text>
          </TouchableOpacity>
        ) : (
          groups.slice(0, 3).map(g => (
            <TouchableOpacity key={g.id} onPress={() => router.push(`/chat/${g.id}` as any)}
              className="flex-row items-center rounded-xl px-4 py-3 mb-2"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: colors.accent + '20' }}
              >
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 16 }}>
                  {g.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-semibold text-sm" style={{ color: colors.text }} numberOfLines={1}>{g.name}</Text>
                  {(g as any).unread > 0 && (
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accent }}>
                      <Text className="text-white font-bold text-[10px]">{(g as any).unread}</Text>
                    </View>
                  )}
                </View>
                <Text className="text-[11px]" style={{ color: colors.text3 }}>Kod: {g.invite_code}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.text3} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default GelirGiderKarti;
