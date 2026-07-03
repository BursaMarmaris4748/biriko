import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useGroups } from '@/hooks/useGroups';

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { groups, loading, createGroup } = useGroups();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmails, setNewEmails] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Hata', 'Grup adı gerekli.'); return; }
    setCreating(true);
    try {
      const emails = newEmails.split(',').map(e => e.trim()).filter(Boolean);
      await createGroup(newName.trim(), emails);
      setShowCreate(false);
      setNewName('');
      setNewEmails('');
      Alert.alert('Başarılı', 'Grup oluşturuldu.');
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Grup oluşturulamadı.');
    }
    setCreating(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Text style={{ color: colors.text }} className="text-2xl font-bold">Gruplar</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.accent }}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <MaterialCommunityIcons name="forum-outline" size={64} color={colors.text3} />
          <Text style={{ color: colors.text }} className="text-lg font-bold mt-4 text-center">Henüz grubun yok</Text>
          <Text style={{ color: colors.text3 }} className="text-sm mt-2 text-center">Yeni bir grup oluştur veya bir gruba davet edil</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)}
            className="mt-6 rounded-2xl py-3.5 px-8"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-white font-bold">Grup Oluştur</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {groups.map(g => (
            <TouchableOpacity key={g.id} onPress={() => router.push(`/chat/${g.id}` as any)}
              className="flex-row items-center rounded-2xl p-4 mb-3 border"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: colors.accent }}>
                <Text className="text-white font-bold text-lg">{g.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-bold text-base">{g.name}</Text>
                <Text style={{ color: colors.text3 }} className="text-xs mt-0.5">
                  {g.description || 'Sohbet grubu'}
                </Text>
              </View>
              {(g as any).unread > 0 && (
                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: colors.accent }}>
                  <Text className="text-white font-bold text-xs">{(g as any).unread}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Create Group Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowCreate(false)}>
          <Pressable onPress={() => {}}
            className="rounded-t-3xl p-5 border-t"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text style={{ color: colors.text }} className="font-bold text-lg mb-4">Grup Oluştur</Text>
            <TextInput
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              className="rounded-xl px-4 py-3 text-base mb-3 border"
              placeholder="Grup adı"
              placeholderTextColor={colors.text3}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              className="rounded-xl px-4 py-3 text-base mb-3 border"
              placeholder="E-posta ile davet et (virgülle ayır)"
              placeholderTextColor={colors.text3}
              value={newEmails}
              onChangeText={setNewEmails}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              onPress={handleCreate}
              disabled={creating}
              className="rounded-2xl py-3.5 items-center"
              style={{ backgroundColor: colors.accent }}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Oluştur</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
