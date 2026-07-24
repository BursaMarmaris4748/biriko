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
  const { groups, loading, reload, createGroup, joinGroup } = useGroups();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [createdGroup, setCreatedGroup] = useState<{ name: string; invite_code: string } | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: colors.shimmer }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text }} className="text-xl font-bold flex-1">Gruplar</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setShowJoin(true)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.shimmer }}
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
        <View className="flex-1 items-center justify-center px-10" style={{ marginTop: -60 }}>
          <View className="w-20 h-20 rounded-full items-center justify-center mb-5" style={{ backgroundColor: colors.shimmer }}>
            <MaterialCommunityIcons name="forum-outline" size={40} color={colors.text3} />
          </View>
          <Text style={{ color: colors.text }} className="text-xl font-bold text-center">Henüz grubun yok</Text>
          <Text style={{ color: colors.text3 }} className="text-sm mt-2 text-center max-w-[220px]">
            Yeni bir grup oluştur veya davet koduyla katıl
          </Text>
          <View className="flex-row gap-3 mt-8">
            <TouchableOpacity onPress={() => setShowCreate(true)}
              className="rounded-2xl py-3.5 px-6"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-white font-bold">Grup Oluştur</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowJoin(true)}
              className="rounded-2xl py-3.5 px-6"
              style={{ backgroundColor: colors.shimmer }}
            >
              <Text style={{ color: colors.accent }} className="font-bold">Koda Katıl</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {groups.map(g => (
            <TouchableOpacity key={g.id} onPress={() => router.push(`/chat/${g.id}` as any)}
              className="flex-row items-center rounded-2xl p-4 mb-3"
              style={{ backgroundColor: colors.card }}
            >
              <View className="w-14 h-14 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.accent + '20' }}
              >
                <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '700' }}>{g.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: colors.text }} className="font-bold text-base">{g.name}</Text>
                  {(g as any).unread > 0 && (
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accent }}>
                      <Text className="text-white font-bold text-[10px]">{(g as any).unread}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.text3 }} className="text-xs mt-0.5">
                  Kod: <Text style={{ fontWeight: '600', letterSpacing: 1 }}>{g.invite_code}</Text>
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text3} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowCreate(false)}>
          <Pressable onPress={() => {}}
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <View className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: colors.text3 + '40' }} />
            <Text style={{ color: colors.text }} className="font-bold text-xl mb-5">Grup Oluştur</Text>
            <TextInput
              style={{ backgroundColor: colors.inputBg, color: colors.text }}
              className="rounded-2xl px-5 py-4 text-base mb-5"
              placeholder="Grup adı"
              placeholderTextColor={colors.text3}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Text style={{ color: colors.text3 }} className="text-xs mb-6 leading-4">
              Oluşturulan grubun davet kodunu arkadaşlarınla paylaşarak onları ekleyebilirsin.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowCreate(false)}
                className="flex-1 rounded-2xl py-3.5 items-center"
                style={{ backgroundColor: colors.shimmer }}
              >
                <Text style={{ color: colors.text3 }} className="font-bold text-base">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={creating}
                className="flex-1 rounded-2xl py-3.5 items-center"
                style={{ backgroundColor: colors.accent, opacity: creating ? 0.6 : 1 }}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Oluştur</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Invite Code Modal */}
      <Modal visible={!!createdGroup} transparent animationType="fade" onRequestClose={() => setCreatedGroup(null)}>
        <Pressable className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setCreatedGroup(null)}>
          <Pressable onPress={() => {}}
            className="rounded-3xl p-7 mx-8 w-80 items-center"
            style={{ backgroundColor: colors.card }}
          >
            <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#d1fae5' }}>
              <MaterialCommunityIcons name="check" size={32} color="#10b981" />
            </View>
            <Text style={{ color: colors.text }} className="text-xl font-bold text-center">{createdGroup?.name}</Text>
            <Text style={{ color: colors.text3 }} className="text-sm mt-1 mb-5">Grup oluşturuldu!</Text>
            <Text style={{ color: colors.text2 }} className="text-xs font-medium mb-2">DAVET KODU</Text>
            <View className="rounded-2xl px-6 py-4 mb-5 w-full items-center" style={{ backgroundColor: colors.shimmer }}>
              <Text style={{ color: colors.accent, letterSpacing: 5, fontSize: 26, fontWeight: '900' }}>{createdGroup?.invite_code}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { if (createdGroup) handleShareCode(createdGroup.invite_code); }}
              className="rounded-2xl py-3.5 px-8 mb-3 flex-row items-center gap-2"
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

      {/* Join Modal */}
      <Modal visible={showJoin} transparent animationType="slide" onRequestClose={() => setShowJoin(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setShowJoin(false)}>
          <Pressable onPress={() => {}}
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <View className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: colors.text3 + '40' }} />
            <Text style={{ color: colors.text }} className="font-bold text-xl mb-2">Koda Katıl</Text>
            <Text style={{ color: colors.text3 }} className="text-sm mb-6">
              Arkadaşından aldığın 8 haneli davet kodunu gir.
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.inputBg,
                color: colors.text,
                letterSpacing: 8,
                fontSize: 28,
                fontWeight: '800',
                textAlign: 'center',
              }}
              className="rounded-2xl px-4 py-5 mb-6"
              placeholder="XXXXXXXX"
              placeholderTextColor={colors.text3 + '50'}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={8}
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowJoin(false)}
                className="flex-1 rounded-2xl py-3.5 items-center"
                style={{ backgroundColor: colors.shimmer }}
              >
                <Text style={{ color: colors.text3 }} className="font-bold text-base">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleJoin}
                disabled={joining || joinCode.trim().length < 4}
                className="flex-1 rounded-2xl py-3.5 items-center"
                style={{ backgroundColor: colors.accent, opacity: (joining || joinCode.trim().length < 4) ? 0.5 : 1 }}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Katıl</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
