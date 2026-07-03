import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useGroups } from '@/hooks/useGroups';

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { groups, loading, createGroup, joinGroup } = useGroups();

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite code display after creation
  const [createdGroup, setCreatedGroup] = useState<{ name: string; invite_code: string } | null>(null);

  // Join modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Hata', 'Grup adı gerekli.'); return; }
    setCreating(true);
    try {
      const group = await createGroup(newName.trim());
      setShowCreate(false);
      setNewName('');
      setCreatedGroup({ name: group.name, invite_code: group.invite_code });
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Grup oluşturulamadı.');
    }
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { Alert.alert('Hata', 'Davet kodu gerekli.'); return; }
    setJoining(true);
    try {
      await joinGroup(joinCode.trim());
      setShowJoin(false);
      setJoinCode('');
      Alert.alert('Başarılı', 'Gruba katıldın!');
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Katılınamadı.');
    }
    setJoining(false);
  };

  const handleShareCode = async (code: string) => {
    try {
      await Share.share({
        message: `Biriko'da sohbet grubuma katıl! Davet kodum: ${code}\n\nKodu Biriko uygulamasındaki Gruplar > Koda Katıl bölümünden girebilirsin.`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Text style={{ color: colors.text }} className="text-2xl font-bold">Gruplar</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setShowJoin(true)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCreate(true)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <MaterialCommunityIcons name="forum-outline" size={64} color={colors.text3} />
          <Text style={{ color: colors.text }} className="text-lg font-bold mt-4 text-center">Henüz grubun yok</Text>
          <Text style={{ color: colors.text3 }} className="text-sm mt-2 text-center">
            Yeni bir grup oluştur veya davet koduyla bir gruba katıl
          </Text>
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity onPress={() => setShowCreate(true)}
              className="rounded-2xl py-3.5 px-6"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-white font-bold">Grup Oluştur</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowJoin(true)}
              className="rounded-2xl py-3.5 px-6"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.accent }} className="font-bold">Koda Katıl</Text>
            </TouchableOpacity>
          </View>
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
                  Kod: <Text style={{ fontWeight: '600' }}>{g.invite_code}</Text>
                </Text>
              </View>
              {(g as any).unread > 0 && (
                <View className="w-6 h-6 rounded-full items-center justify-center mr-1" style={{ backgroundColor: colors.accent }}>
                  <Text className="text-white font-bold text-xs">{(g as any).unread}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} style={{ marginLeft: 4 }} />
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
              className="rounded-xl px-4 py-3 text-base mb-4 border"
              placeholder="Grup adı"
              placeholderTextColor={colors.text3}
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={{ color: colors.text3 }} className="text-xs mb-4">
              Grup oluşturunca otomatik olarak bir davet kodu oluşacak. Bu kodu arkadaşlarınla paylaşarak onları gruba ekleyebilirsin.
            </Text>
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

      {/* Invite Code Display Modal */}
      <Modal visible={!!createdGroup} transparent animationType="fade" onRequestClose={() => setCreatedGroup(null)}>
        <Pressable className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setCreatedGroup(null)}>
          <Pressable onPress={() => {}}
            className="rounded-3xl p-6 mx-8 w-80 items-center"
            style={{ backgroundColor: colors.card }}
          >
            <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.accent + '20' }}>
              <MaterialCommunityIcons name="check" size={32} color={colors.accent} />
            </View>
            <Text style={{ color: colors.text }} className="text-lg font-bold text-center">Grup Oluşturuldu!</Text>
            <Text style={{ color: colors.text3 }} className="text-sm mt-1 mb-4 text-center">{createdGroup?.name}</Text>
            <Text style={{ color: colors.text2 }} className="text-xs mb-2">Davet Kodu</Text>
            <View className="rounded-2xl px-6 py-3 mb-4 w-full items-center" style={{ backgroundColor: colors.inputBg }}>
              <Text style={{ color: colors.accent, letterSpacing: 4 }} className="text-2xl font-black">{createdGroup?.invite_code}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { if (createdGroup) handleShareCode(createdGroup.invite_code); }}
              className="rounded-2xl py-3 px-6 mb-2 flex-row items-center gap-2"
              style={{ backgroundColor: colors.accent }}
            >
              <MaterialCommunityIcons name="share-variant" size={18} color="#fff" />
              <Text className="text-white font-bold">Kodu Paylaş</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCreatedGroup(null)}>
              <Text style={{ color: colors.text3 }} className="text-sm font-medium">Kapat</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={showJoin} transparent animationType="slide" onRequestClose={() => setShowJoin(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowJoin(false)}>
          <Pressable onPress={() => {}}
            className="rounded-t-3xl p-5 border-t"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text style={{ color: colors.text }} className="font-bold text-lg mb-4">Koda Katıl</Text>
            <Text style={{ color: colors.text3 }} className="text-sm mb-3">
              Bir arkadaşından aldığın davet kodunu girerek gruba katıl.
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
                letterSpacing: 6,
                fontSize: 22,
                fontWeight: '800',
                textAlign: 'center',
              }}
              className="rounded-xl px-4 py-4 mb-4 border"
              placeholder="XXXXXX"
              placeholderTextColor={colors.text3}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              onPress={handleJoin}
              disabled={joining || joinCode.trim().length < 4}
              className="rounded-2xl py-3.5 items-center"
              style={{ backgroundColor: colors.accent, opacity: (joining || joinCode.trim().length < 4) ? 0.5 : 1 }}
            >
              {joining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Katıl</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
