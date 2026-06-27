import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn, loading, error, disabled } = useGoogleAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="w-20 h-20 bg-[#0058bc]/10 rounded-2xl items-center justify-center mb-6">
        <MaterialCommunityIcons name="account-plus-outline" size={42} color="#0058bc" />
      </View>
      <Text className="text-3xl font-bold text-gray-900 mb-1">Hesap Oluştur</Text>
      <Text className="text-gray-500 mb-10">Biriko ile tanışmaya hazır mısın?</Text>

      {error && (
        <View className="bg-red-50 px-4 py-3 rounded-xl mb-4 w-full">
          <Text className="text-red-600 text-sm text-center">{error}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={signIn}
        disabled={disabled || loading}
        className="flex-row items-center justify-center w-full py-3.5 px-6 rounded-2xl border border-gray-200 bg-white mb-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#6B7280" />
        ) : (
          <>
            <MaterialCommunityIcons name="google" size={20} color="#1a1a2e" style={{ marginRight: 10 }} />
            <Text className="text-base font-semibold text-gray-800">Google ile kayıt ol</Text>
          </>
        )}
      </TouchableOpacity>

      <View className="flex-row mt-8">
        <Text className="text-gray-500 text-sm">Zaten hesabın var mı? </Text>
        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text className="font-bold text-sm text-[#0058bc]">Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
