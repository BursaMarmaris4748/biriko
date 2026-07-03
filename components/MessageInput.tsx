import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/lib/supabase';

interface Props {
  onSendText: (text: string) => Promise<void>;
  onSendImage: (uri: string) => Promise<void>;
  onShareTransaction: () => void;
  sending: boolean;
}

export default function MessageInput({ onSendText, onSendImage, onShareTransaction, sending }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    await onSendText(text);
    setText('');
  };

  const handlePickImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAndSend(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('[chat] image pick error:', e);
    }
  };

  const handleCameraImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAndSend(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('[chat] camera error:', e);
    }
  };

  const uploadAndSend = async (uri: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `chat/${user.id}/${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri, name: fileName, type: `image/${ext}` } as any);

      const { data: upload, error: uErr } = await supabase.storage
        .from('chat-photos')
        .upload(fileName, formData as any, { upsert: false });
      if (uErr) { console.warn('[chat] upload error:', uErr); return; }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-photos')
        .getPublicUrl(fileName);

      await onSendImage(publicUrl);
    } catch (e) {
      console.warn('[chat] upload exception:', e);
    }
  };

  return (
    <View
      className="flex-row items-end px-3 py-2 border-t"
      style={{ backgroundColor: colors.card, borderTopColor: colors.border }}
    >
      <TouchableOpacity onPress={handlePickImage} className="p-2 mb-0.5">
        <MaterialCommunityIcons name="image-outline" size={22} color={colors.text3} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleCameraImage} className="p-2 mb-0.5">
        <MaterialCommunityIcons name="camera-outline" size={22} color={colors.text3} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onShareTransaction} className="p-2 mb-0.5">
        <MaterialCommunityIcons name="swap-horizontal-bold" size={22} color={colors.text3} />
      </TouchableOpacity>
      <View className="flex-1 mx-1 rounded-xl px-3" style={{ backgroundColor: colors.inputBg, minHeight: 40, justifyContent: 'center' }}>
        <TextInput
          style={{ color: colors.text, maxHeight: 100 }}
          className="text-sm py-2"
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.text3}
          multiline
          value={text}
          onChangeText={setText}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Enter') handleSend();
          }}
        />
      </View>
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || sending}
        className="w-10 h-10 rounded-full items-center justify-center ml-1"
        style={{ backgroundColor: text.trim() ? colors.accent : colors.border }}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <MaterialCommunityIcons name="send" size={18} color={text.trim() ? '#fff' : colors.text3} />
        )}
      </TouchableOpacity>
    </View>
  );
}
