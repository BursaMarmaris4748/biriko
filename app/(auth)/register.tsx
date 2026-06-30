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
import { useTheme } from '@/contexts/theme-context';

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const { signIn: googleSignIn, loading: googleLoading, error: googleError } = useGoogleAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Uyarı', 'Tüm alanlar gerekli.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Uyarı', 'Şifre en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    const result = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (result.error) {
      Alert.alert('Kayıt Başarısız', result.error);
    } else {
      Alert.alert(
        'Kayıt Başarılı',
        'Hesabınız oluşturuldu. Lütfen e-posta adresinize gelen doğrulama bağlantısına tıklayın.',
        [{ text: 'Tamam', onPress: () => router.push('/login' as any) }]
      );
    }
  };

  const renderInput = (field: 'name' | 'email' | 'password') => {
    const isFocused = focusedField === field;
    const isName = field === 'name';
    const isEmail = field === 'email';
    return (
      <View className="mb-4">
        <View
          className="flex-row items-center px-5"
          style={{
            backgroundColor: isFocused ? colors.accentLight : colors.inputBg,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: isFocused ? colors.accent : colors.border,
            height: 56,
          }}
        >
          <MaterialCommunityIcons
            name={(isName ? 'account-outline' : isEmail ? 'email-outline' : 'lock-outline') as any}
            size={20}
            color={isFocused ? colors.accent : colors.text3}
          />
          <TextInput
            className="flex-1 ml-3 text-base"
            style={{ color: colors.text }}
            placeholder={isName ? 'Adın Soyadın' : isEmail ? 'E-posta adresin' : 'Şifre (en az 6 karakter)'}
            placeholderTextColor="#b0b7c3"
            secureTextEntry={!isName && !isEmail && !showPassword}
            keyboardType={isEmail ? 'email-address' : 'default'}
            autoCapitalize={isName ? 'words' : 'none'}
            value={isName ? name : isEmail ? email : password}
            onChangeText={isName ? setName : isEmail ? setEmail : setPassword}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
          />
          {!isName && !isEmail && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
              <MaterialCommunityIcons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={colors.text3}
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
        className="rounded-3xl p-6 mb-6"
        style={{
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          shadowColor: colors.text3,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>Aramıza Katıl</Text>
        <Text className="text-sm mb-6" style={{ color: colors.text3 }}>Bilgilerini gir, hemen başla</Text>

        {googleError && (
          <View className="bg-red-50 px-4 py-3 rounded-xl mb-4">
            <Text className="text-red-600 text-xs text-center">{googleError}</Text>
          </View>
        )}

        {renderInput('name')}
        {renderInput('email')}
        {renderInput('password')}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          className="items-center justify-center mt-2 mb-4"
          style={{
            backgroundColor: colors.accent,
            borderRadius: 16,
            height: 54,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
          <Text className="mx-4 text-xs font-medium" style={{ color: colors.text3 }}>veya</Text>
          <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
        </View>

        <TouchableOpacity
          onPress={googleSignIn}
          disabled={googleLoading}
          className="flex-row items-center justify-center"
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            height: 50,
            backgroundColor: colors.card,
          }}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <MaterialCommunityIcons name="google" size={18} color={colors.text} style={{ marginRight: 8 }} />
              <Text className="font-semibold text-sm" style={{ color: colors.text }}>Google ile kayıt ol</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View className="flex-row justify-center" style={{ opacity: fadeAnim }}>
        <Text className="text-sm" style={{ color: colors.text3 }}>Zaten hesabın var mı? </Text>
        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text className="font-bold text-sm" style={{ color: colors.accent }}>Giriş Yap</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="h-[240px]" style={{ backgroundColor: '#0058bc', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
        <Animated.View
          className="flex-1 items-center justify-center px-8"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4">
            <MaterialCommunityIcons name="account-plus-outline" size={42} color="#ffffff" />
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">Hesap Oluştur</Text>
          <Text className="text-white/70 text-sm mt-1">Biriko ile tanışmaya hazır mısın?</Text>
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
