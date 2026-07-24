import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  noHorizontalPadding?: boolean;
}

/**
 * Tüm ekranlar için güvenli alan wrapper'ı.
 * - Üst + alt sistem gesture bar / çentik için otomatik boşluk bırakır
 * - Tab bar'larda da 'top' + 'bottom' korunur
 * - Background rengi tema ile eşleşir
 */
export default function ScreenContainer({
  children,
  style,
  edges = ['top', 'bottom'],
  noHorizontalPadding = false,
}: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg }, style]}
      edges={edges}
    >
      <View
        style={[styles.inner, !noHorizontalPadding && { paddingHorizontal: 0 }]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

/**
 * BottomNavigationBarSafe — tab bar gibi alt içerikler için.
 * SafeAreaView içine almadan doğrudan height'e eklemek için hook.
 */
export function useBottomSafePadding(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
