import React from 'react';
import { View, Text } from 'react-native';

const iconColors = [
  '#E11D48', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#0EA5E9', '#D946EF', '#22C55E', '#EAB308', '#A855F7',
  '#06B6D4', '#F43F5E', '#8B5CF6', '#10B981', '#3B82F6',
];

function hashColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  return iconColors[Math.abs(hash) % iconColors.length];
}

export default function StockIcon({ symbol, name, size = 36 }: { symbol: string; name?: string; size?: number }) {
  const color = hashColor(symbol);
  const letter = (name || symbol).charAt(0).toUpperCase();
  const fontSize = size * 0.42;
  return (
    <View className="items-center justify-center rounded-full" style={{ width: size, height: size, backgroundColor: color + '20' }}>
      <Text style={{ color, fontSize, fontWeight: '800', lineHeight: fontSize * 1.1 }}>{letter}</Text>
    </View>
  );
}
