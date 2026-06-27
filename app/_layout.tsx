import "../global.css";
import { useRouter, usePathname, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/services/auth-context";
import { FinanceProvider } from "@/services/finance-context";
import { setupNotificationHandler } from "@/services/notifications";

setupNotificationHandler();

function RootGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const inAuth = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

    if (!session && !inAuth) {
      router.replace('/login' as any);
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, pathname, router]);

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
