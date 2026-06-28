import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MarketPrice {
  symbol: string;
  name: string;
  buy: number;
  sell: number;
  change: number;
  icon: string;
  dailyOpen: number;
  history: number[];
}

export interface Investment {
  id: string;
  type: 'gold' | 'usd' | 'eur' | 'btc' | 'eth' | 'other';
  label: string;
  amount: number;
  cost: number;
  date: string;
}

const STORAGE_KEY = '@biriko/investments';
const DAILY_OPEN_KEY = '@biriko/daily-open';

let cachedPrices: MarketPrice[] = [];
let lastFetch = 0;
let priceHistory: Record<string, number[]> = {};

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getDailyOpen(): Promise<Record<string, number>> {
  try {
    const json = await AsyncStorage.getItem(DAILY_OPEN_KEY);
    if (!json) return {};
    const data = JSON.parse(json);
    if (data.date === getTodayKey()) return data.prices;
    return {};
  } catch { return {}; }
}

async function saveDailyOpen(prices: Record<string, number>): Promise<void> {
  await AsyncStorage.setItem(DAILY_OPEN_KEY, JSON.stringify({ date: getTodayKey(), prices }));
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) { console.warn(`[market-data] ${url} returned ${r.status}`); return null; }
    return await r.json() as T;
  } catch (e) {
    console.warn(`[market-data] ${url} failed:`, e);
    return null;
  }
}

export async function fetchMarketPrices(): Promise<MarketPrice[]> {
  const now = Date.now();
  if (now - lastFetch < 15000 && cachedPrices.length) return cachedPrices;

  const [exchangeData, goldData, coinData] = await Promise.all([
    safeFetch<any>('https://api.exchangerate-api.com/v4/latest/TRY'),
    safeFetch<any>('https://api.gold-api.com/price/XAU'),
    safeFetch<any>('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=try'),
  ]);

  if (!exchangeData && !coinData) {
    return cachedPrices.length ? cachedPrices : [];
  }

  const usdRate = exchangeData ? 1 / exchangeData.rates.USD : (cachedPrices.find(p => p.symbol === 'USD')?.sell || 0);
  const eurRate = exchangeData ? 1 / exchangeData.rates.EUR : (cachedPrices.find(p => p.symbol === 'EUR')?.sell || 0);
  const goldOzUsd = goldData?.price ?? (cachedPrices.find(p => p.symbol === 'GA')?.sell ?? 0);
  const gramAltin = goldOzUsd && usdRate ? (goldOzUsd * usdRate) / 31.1 : 0;

  const rawPrices: Record<string, number> = {};
  if (usdRate) rawPrices.USD = usdRate;
  if (eurRate) rawPrices.EUR = eurRate;
  if (gramAltin) rawPrices.GA = gramAltin;
  if (coinData?.bitcoin?.try) rawPrices.BTC = coinData.bitcoin.try;
  if (coinData?.ethereum?.try) rawPrices.ETH = coinData.ethereum.try;

  const symbols = ['USD', 'EUR', 'GA', 'BTC', 'ETH'];
  const hasAll = symbols.every(s => rawPrices[s]);

  const dailyOpen = await getDailyOpen();
  const isNewDay = Object.keys(dailyOpen).length === 0;

  const finalOpen = isNewDay ? rawPrices : dailyOpen;
  if (isNewDay && hasAll) await saveDailyOpen(rawPrices);

  const names: Record<string, string> = { USD: 'Dolar', EUR: 'Euro', GA: 'Gram Altın', BTC: 'Bitcoin', ETH: 'Ethereum' };
  const icons: Record<string, string> = { USD: 'currency-usd', EUR: 'currency-eur', GA: 'gold', BTC: 'bitcoin', ETH: 'ethereum' };

  const existingCached = cachedPrices.length > 0;

  const newPrices: MarketPrice[] = symbols.map(symbol => {
    const sell = rawPrices[symbol] || (existingCached ? cachedPrices.find(p => p.symbol === symbol)?.sell ?? 0 : 0);
    if (!sell) return null;

    const open = finalOpen[symbol] || sell;
    const change = open > 0 ? ((sell - open) / open) * 100 : 0;

    if (!priceHistory[symbol]) priceHistory[symbol] = [];
    priceHistory[symbol].push(sell);
    if (priceHistory[symbol].length > 20) priceHistory[symbol].shift();

    return {
      symbol,
      name: names[symbol] || symbol,
      buy: sell * 0.995,
      sell,
      change,
      icon: icons[symbol] || 'currency-usd',
      dailyOpen: open,
      history: [...priceHistory[symbol]],
    };
  }).filter(Boolean) as MarketPrice[];

  if (newPrices.length) {
    cachedPrices = newPrices;
    lastFetch = now;
  }

  return newPrices.length ? newPrices : cachedPrices;
}

export async function loadInvestments(): Promise<Investment[]> {
  try { const json = await AsyncStorage.getItem(STORAGE_KEY); return json ? JSON.parse(json) : []; }
  catch { return []; }
}

export async function saveInvestments(list: Investment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
