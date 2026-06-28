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

export async function fetchMarketPrices(): Promise<MarketPrice[]> {
  const now = Date.now();
  if (now - lastFetch < 15000 && cachedPrices.length) return cachedPrices;

  try {
    const exchangeRatesRes = fetch('https://api.exchangerate-api.com/v4/latest/TRY').then(r => r.ok ? r.json() : Promise.reject());
    const goldRes = fetch('https://api.gold-api.com/price/XAU').then(r => r.ok ? r.json() : Promise.reject());
    const coinRes = fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=try').then(r => r.ok ? r.json() : Promise.reject());

    const [exchangeData, goldData, coinData] = await Promise.all([exchangeRatesRes, goldRes, coinRes]);

    const usdSell = 1 / exchangeData.rates.USD;
    const eurSell = 1 / exchangeData.rates.EUR;
    const goldOzUsd = goldData.price;
    const gramAltinSell = (goldOzUsd * usdSell) / 31.1;

    const rawPrices: Record<string, number> = {
      USD: usdSell,
      EUR: eurSell,
      GA: gramAltinSell,
      BTC: coinData.bitcoin.try,
      ETH: coinData.ethereum.try,
    };

    const dailyOpen = await getDailyOpen();
    const isNewDay = Object.keys(dailyOpen).length === 0;

    const finalOpen = isNewDay ? rawPrices : dailyOpen;
    if (isNewDay) await saveDailyOpen(rawPrices);

    const newPrices: MarketPrice[] = Object.entries(rawPrices).map(([symbol, sell]) => {
      const open = finalOpen[symbol] || sell;
      const change = open > 0 ? ((sell - open) / open) * 100 : 0;

      const names: Record<string, string> = { USD: 'Dolar', EUR: 'Euro', GA: 'Gram Altın', BTC: 'Bitcoin', ETH: 'Ethereum' };
      const icons: Record<string, string> = { USD: 'currency-usd', EUR: 'currency-eur', GA: 'gold', BTC: 'bitcoin', ETH: 'ethereum' };

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
    });

    cachedPrices = newPrices;
    lastFetch = now;
    return newPrices;
  } catch {
    return cachedPrices.length ? cachedPrices : [];
  }
}

export async function loadInvestments(): Promise<Investment[]> {
  try { const json = await AsyncStorage.getItem(STORAGE_KEY); return json ? JSON.parse(json) : []; }
  catch { return []; }
}

export async function saveInvestments(list: Investment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
