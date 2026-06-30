import "../global.css";
import { useRouter, usePathname, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0a0a14' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootGuard>
        <Slot />
      </RootGuard>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
