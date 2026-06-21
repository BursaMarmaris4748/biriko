import "../global.css";
import { useSegments, useRouter, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/services/auth-context";
import { FinanceProvider } from "@/services/finance-context";

function RootGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#f2f5f9] items-center justify-center">
        <ActivityIndicator size="large" color="#0058bc" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <StatusBar style="dark" />
        <RootGuard>
          <Slot />
        </RootGuard>
      </FinanceProvider>
    </AuthProvider>
  );
}
