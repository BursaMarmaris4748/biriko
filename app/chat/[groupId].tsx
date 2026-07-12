import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useChat } from '@/hooks/useChat';
import MessageBubble from '@/components/MessageBubble';
import MessageInput from '@/components/MessageInput';
import TransactionShare from '@/components/TransactionShare';

export default function ChatScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { colors } = useTheme();
  const { messages, loading, sending, hasMore, loadMore, sendMessage, members, currentUserId, groupName } = useChat(groupId || '');
  const flatRef = useRef<FlatList>(null);
  const [showTransactionShare, setShowTransactionShare] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const prevCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCount.current) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
    prevCount.current = messages.length;
  }, [messages.length]);

  const handleSendText = async (text: string) => {
    await sendMessage('text', text);
  };

  const handleSendImage = async (uri: string) => {
    await sendMessage('image', uri);
  };

  const handleTransactionSelect = async (transaction: any) => {
    setShowTransactionShare(false);
    await sendMessage('transaction', `${transaction.type === 'gelir' ? 'Gelir' : 'Gider'}: ${transaction.category}`, {
      transaction_id: transaction.id,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
      note: transaction.note,
    });
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) loadMore();
  };

  const isOwn = (senderId: string) => senderId === currentUserId;

  // Group messages by date
  const groupKey = (item: any) => {
    const d = new Date(item.created_at);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  const dateLabel = (key: string) => {
    const d = new Date(key);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const showSender = !prev || prev.sender_id !== item.sender_id;
    const own = isOwn(item.sender_id);
    const curGroupKey = groupKey(item);
    const prevGroupKey = prev ? groupKey(prev) : null;
    return (
      <>
        {curGroupKey !== prevGroupKey && (
          <View className="items-center my-3">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.border }}>
              <Text style={{ color: colors.text3 }} className="text-[10px] font-medium">{dateLabel(curGroupKey)}</Text>
            </View>
          </View>
        )}
        <MessageBubble message={item} isOwn={own} showSender={showSender} onImagePress={setImagePreview} />
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']} className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text style={{ color: colors.text }} className="font-bold text-base">{groupName || 'Sohbet'}</Text>
          <Text style={{ color: colors.text3 }} className="text-xs">{members.length} üye</Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <MaterialCommunityIcons name="chat-outline" size={64} color={colors.text3} />
          <Text style={{ color: colors.text }} className="text-lg font-bold mt-4">Henüz mesaj yok</Text>
          <Text style={{ color: colors.text3 }} className="text-sm mt-2 text-center">İlk mesajı sen yaz</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={renderItem}
            className="flex-1"
            contentContainerStyle={{ paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={hasMore && !loading ? <ActivityIndicator size="small" color={colors.accent} style={{ paddingVertical: 12 }} /> : null}
            keyboardShouldPersistTaps="handled"
          />
          <MessageInput
            onSendText={handleSendText}
            onSendImage={handleSendImage}
            onShareTransaction={() => setShowTransactionShare(true)}
            sending={sending}
          />
        </KeyboardAvoidingView>
      )}

      {/* Transaction Share Modal */}
      <TransactionShare
        visible={showTransactionShare}
        onClose={() => setShowTransactionShare(false)}
        onSelect={handleTransactionSelect}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal uri={imagePreview} onClose={() => setImagePreview(null)} />
    </SafeAreaView>
  );
}

function ImagePreviewModal({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const { colors } = useTheme();
  if (!uri) return null;
  return (
    <View className="absolute inset-0 z-50 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
      <TouchableOpacity onPress={onClose} className="absolute top-14 right-5 z-10">
        <MaterialCommunityIcons name="close" size={28} color="#fff" />
      </TouchableOpacity>
      <Image source={{ uri }} className="w-full h-full" resizeMode="contain" />
    </View>
  );
}
