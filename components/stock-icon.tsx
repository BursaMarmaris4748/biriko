import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

const STOCK_DOMAINS: Record<string, string> = {
  THYAO: 'turkishairlines.com', GARAN: 'garantibbva.com.tr', AKBNK: 'akbank.com',
  EREGL: 'erdemir.com.tr', TUPRS: 'tupras.com.tr', ASELS: 'aselsan.com.tr',
  KCHOL: 'koc.com.tr', SAHOL: 'sabanci.com', FROTO: 'fordotosan.com.tr',
  SISE: 'sisecam.com', PGSUS: 'flypgs.com', HEKTS: 'hektas.com.tr',
  BIMAS: 'bim.com.tr', TCELL: 'turkcell.com.tr', VAKBN: 'vakifbank.com.tr',
  YKBNK: 'yapikredi.com.tr', ISCTR: 'isbank.com.tr', SOKM: 'sokmarket.com.tr',
  MGROS: 'migros.com.tr', KOZAA: 'kozaaltin.com.tr',
  AEFES: 'anadoluefes.com', VESTL: 'vestel.com.tr', TOASO: 'tofas.com.tr',
  OTKAR: 'otokar.com.tr', ENKAI: 'enkai.com.tr', TAVHL: 'tavhavalimanlari.com.tr',
  TTKOM: 'turktelekom.com.tr', PETKM: 'petkim.com.tr', SASTAS: 'sastas.com.tr',
  ECILC: 'eczacibasi.com.tr',
  AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'abc.xyz',
  AMZN: 'amazon.com', NVDA: 'nvidia.com', META: 'meta.com',
  TSLA: 'tesla.com', JPM: 'jpmorganchase.com', V: 'visa.com',
  SPY: 'spdrs.com', QQQ: 'invesco.com', AMD: 'amd.com',
  NFLX: 'netflix.com', DIS: 'thewaltdisneycompany.com', KO: 'coca-colacompany.com',
  PEP: 'pepsico.com', WMT: 'walmart.com', JNJ: 'jnj.com',
  PG: 'pg.com', BAC: 'bankofamerica.com', MA: 'mastercard.com',
  UNH: 'unitedhealthgroup.com', HD: 'homedepot.com', INTC: 'intel.com',
  CSCO: 'cisco.com', PFE: 'pfizer.com', NKE: 'nike.com',
  VZ: 'verizon.com', T: 'att.com', BA: 'boeing.com',
};

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
  const [failed, setFailed] = useState(false);
  const domain = STOCK_DOMAINS[symbol.toUpperCase()];
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}?size=${size * 2}` : null;
  const color = hashColor(symbol);
  const fontSize = size * 0.42;

  if (logoUrl && !failed) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#f0f2f5' }}>
        <Image source={{ uri: logoUrl }} style={{ width: size, height: size }} onError={() => setFailed(true)} />
      </View>
    );
  }

  const letter = (name || symbol).charAt(0).toUpperCase();
  return (
    <View className="items-center justify-center rounded-full" style={{ width: size, height: size, backgroundColor: color + '20' }}>
      <Text style={{ color, fontSize, fontWeight: '800', lineHeight: fontSize * 1.1 }}>{letter}</Text>
    </View>
  );
}
