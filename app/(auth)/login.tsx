import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/services/auth-context';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { signIn: googleSignIn, loading: googleLoading, error: googleError } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Uyarı', 'E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      Alert.alert('Giriş Başarısız', result.error);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGoogleSignIn = async () => {
    await googleSignIn();
  };

  const renderInput = (field: 'email' | 'password') => {
    const isFocused = focusedField === field;
    const isEmail = field === 'email';
    return (
      <View className="mb-4">
        <View
          className="flex-row items-center px-5"
          style={{
            backgroundColor: isFocused ? '#f0f7ff' : '#f8f9fc',
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: isFocused ? '#0058bc' : '#e8ecf4',
            height: 56,
          }}
        >
          <MaterialCommunityIcons
            name={isEmail ? 'email-outline' : 'lock-outline'}
            size={20}
            color={isFocused ? '#0058bc' : '#9ca3af'}
          />
          <TextInput
            className="flex-1 ml-3 text-base"
            style={{ color: '#1a1a2e' }}
            placeholder={isEmail ? 'E-posta adresin' : 'Şifren'}
            placeholderTextColor="#b0b7c3"
            secureTextEntry={!isEmail && !showPassword}
            keyboardType={isEmail ? 'email-address' : 'default'}
            autoCapitalize="none"
            value={isEmail ? email : password}
            onChangeText={isEmail ? setEmail : setPassword}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
          />
          {!isEmail && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
              <MaterialCommunityIcons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const content = (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        className="bg-white rounded-3xl p-6 mb-6"
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
        <Text className="text-[#1a1a2e] text-2xl font-bold mb-1">Hoş Geldin</Text>
        <Text className="text-[#9ca3af] text-sm mb-6">Devam etmek için giriş yap</Text>

        {googleError && (
          <View className="bg-red-50 px-4 py-3 rounded-xl mb-4">
            <Text className="text-red-600 text-xs text-center">{googleError}</Text>
          </View>
        )}

        {renderInput('email')}
        {renderInput('password')}

        <TouchableOpacity className="self-end -mt-2" onPress={() => router.push('/forgot-password' as any)}>
          <Text className="text-[#0058bc] text-xs font-semibold">Şifremi Unuttum</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRememberMe(!rememberMe)}
          className="flex-row items-center mb-6 mt-3"
        >
          <View
            className="w-5 h-5 rounded-md items-center justify-center border"
            style={{
              backgroundColor: rememberMe ? '#0058bc' : '#ffffff',
              borderColor: rememberMe ? '#0058bc' : '#c1c6d7',
            }}
          >
            {rememberMe && <MaterialCommunityIcons name="check" size={14} color="#ffffff" />}
          </View>
          <Text className="text-[#414754] text-sm ml-2">Beni Hatırla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
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
            <Text className="text-white font-bold text-base">Giriş Yap</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-[1px]" style={{ backgroundColor: '#e8ecf4' }} />
          <Text className="mx-4 text-xs text-[#9ca3af] font-medium">veya</Text>
          <View className="flex-1 h-[1px]" style={{ backgroundColor: '#e8ecf4' }} />
        </View>

        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex-row items-center justify-center"
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e8ecf4',
            height: 50,
            backgroundColor: '#fafbfc',
          }}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#1a1a2e" />
          ) : (
            <>
              <MaterialCommunityIcons name="google" size={18} color="#1a1a2e" style={{ marginRight: 8 }} />
              <Text className="font-semibold text-sm text-[#1a1a2e]">Google ile devam et</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View className="flex-row justify-center" style={{ opacity: fadeAnim }}>
        <Text className="text-sm text-[#9ca3af]">Hesabın yok mu? </Text>
        <TouchableOpacity onPress={() => router.push('/register' as any)}>
          <Text className="font-bold text-sm text-[#0058bc]">Kayıt Ol</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-[#ffffff]">
      <View className="h-[280px]" style={{ backgroundColor: '#0058bc', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
        <Animated.View
          className="flex-1 items-center justify-center px-8"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4">
            <MaterialCommunityIcons name="wallet-outline" size={42} color="#ffffff" />
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">Biriko</Text>
          <Text className="text-white/70 text-sm mt-1">Finansal hayatını takip et</Text>
        </Animated.View>
      </View>

      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1">{content}</View>
      )}
    </View>
  );
}
