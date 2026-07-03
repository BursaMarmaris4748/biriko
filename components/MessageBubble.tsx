import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Message } from '@/lib/types';
import { useTheme } from '@/contexts/theme-context';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Dün ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  onImagePress,
}: {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  onImagePress?: (url: string) => void;
}) {
  const { colors } = useTheme();
  const senderName = message.sender?.full_name || message.sender?.email?.split('@')[0] || 'Bilinmeyen';

  return (
    <View className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`} style={{ paddingHorizontal: 16 }}>
      <View className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwn && (
          <Text className="text-xs font-semibold mb-1 ml-1" style={{ color: colors.accent }}>{senderName}</Text>
        )}
        <View
          className="rounded-2xl px-4 py-2.5"
          style={{
            backgroundColor: isOwn ? colors.accent : colors.card,
            borderTopLeftRadius: showSender && !isOwn ? 4 : 16,
            borderTopRightRadius: 16,
            borderWidth: isOwn ? 0 : 1,
            borderColor: isOwn ? 'transparent' : colors.border,
          }}
        >
          {message.type === 'image' ? (
            <TouchableOpacity onPress={() => onImagePress?.(message.content)}>
              <Image
                source={{ uri: message.content }}
                className="rounded-xl"
                style={{ width: 200, height: 200 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : message.type === 'transaction' ? (
            <TransactionCard metadata={message.metadata} isOwn={isOwn} />
          ) : (
            <Text style={{ color: isOwn ? '#fff' : colors.text }} className="text-sm leading-5">
              {message.content}
            </Text>
          )}
        </View>
        <View className="flex-row items-center gap-1.5 mt-1 px-1">
          <Text style={{ color: colors.text3 }} className="text-[10px]">{formatTime(message.created_at)}</Text>
          {isOwn && (
            <MaterialCommunityIcons
              name={message.read_by_me ? 'check-all' : 'check'}
              size={14}
              color={message.read_by_me ? '#3b82f6' : colors.text3}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function TransactionCard({ metadata, isOwn }: { metadata: Record<string, any>; isOwn: boolean }) {
  const amount = metadata.amount || 0;
  const isGelir = metadata.type === 'gelir';
  const category = metadata.category || 'Diğer';
  const textColor = isOwn ? '#fff' : '#151c27';
  const iconColor = isOwn ? '#fff' : (isGelir ? '#10b981' : '#ba1a1a');

  return (
    <View className="min-w-[180px]">
      <View className="flex-row items-center gap-2 mb-1.5">
        <MaterialCommunityIcons
          name={isGelir ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={18}
          color={iconColor}
        />
        <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>
          {isGelir ? 'Gelir' : 'Gider'} Paylaştı
        </Text>
      </View>
      <View className="rounded-xl px-3 py-2" style={{ backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : '#f8f9fc' }}>
        <Text className="text-xs" style={{ color: isOwn ? 'rgba(255,255,255,0.8)' : '#727786' }}>{category}</Text>
        <Text style={{ color: textColor, fontWeight: '800', fontSize: 18 }}>
          {isGelir ? '+' : '-'}{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
        </Text>
      </View>
    </View>
  );
}
