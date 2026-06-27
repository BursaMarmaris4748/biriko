import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Uyarı', 'E-posta adresinizi girin.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'biriko://auth/callback',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Animated.View
          className="w-20 h-20 bg-green-100 rounded-2xl items-center justify-center mb-6"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <MaterialCommunityIcons name="email-check-outline" size={42} color="#16a34a" />
        </Animated.View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Kontrol Et</Text>
        <Text className="text-gray-500 text-center mb-8">
          {email} adresine şifre sıfırlama bağlantısı gönderdik.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/login' as any)}
          className="bg-[#0058bc] items-center justify-center rounded-2xl h-12 w-full"
          style={{
            shadowColor: '#0058bc',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text className="text-white font-bold text-base">Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="h-[240px]" style={{ backgroundColor: '#0058bc', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
        <Animated.View
          className="flex-1 items-center justify-center px-8"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4">
            <MaterialCommunityIcons name="lock-reset" size={42} color="#ffffff" />
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">Şifremi Unuttum</Text>
          <Text className="text-white/70 text-sm mt-1">E-posta adresine sıfırlama linki gönder</Text>
        </Animated.View>
      </View>

      <Animated.View
        className="bg-white rounded-3xl p-6 mx-6 -mt-6"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <View className="mb-6">
          <View
            className="flex-row items-center px-5"
            style={{
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#e8ecf4',
              height: 56,
              backgroundColor: '#f8f9fc',
            }}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: '#1a1a2e' }}
              placeholder="E-posta adresin"
              placeholderTextColor="#b0b7c3"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleReset}
          disabled={loading}
          className="items-center justify-center mb-4"
          style={{
            backgroundColor: '#0058bc',
            borderRadius: 16,
            height: 54,
            shadowColor: '#0058bc',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">Gönder</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="items-center">
          <Text className="text-[#0058bc] text-sm font-semibold">Giriş ekranına dön</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
