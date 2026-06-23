import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MarketPrice {
  symbol: string;
  name: string;
  buy: number;
  sell: number;
  icon: string;
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

let cachedPrices: MarketPrice[] = [];
let lastFetch = 0;

export async function fetchMarketPrices(): Promise<MarketPrice[]> {
  const now = Date.now();
  if (now - lastFetch < 15000 && cachedPrices.length) return cachedPrices;

  try {
    const [dovizRes, coinRes] = await Promise.all([
      fetch('https://api.genelpara.com/embed/doviz.json').then(r => r.ok ? r.json() : Promise.reject('doviz fail')),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,cardano&vs_currencies=try').then(r => r.ok ? r.json() : Promise.reject('coingecko fail')),
    ]);

    const prices: MarketPrice[] = [
      { symbol: 'USD', name: 'Dolar', buy: +dovizRes.USD.alis, sell: +dovizRes.USD.satis, icon: 'currency-usd' },
      { symbol: 'EUR', name: 'Euro', buy: +dovizRes.EUR.alis, sell: +dovizRes.EUR.satis, icon: 'currency-eur' },
      { symbol: 'GA', name: 'Gram Altın', buy: +dovizRes.GA.alis, sell: +dovizRes.GA.satis, icon: 'gold' },
      { symbol: 'BTC', name: 'Bitcoin', buy: coinRes.bitcoin.try * 0.995, sell: coinRes.bitcoin.try * 1.005, icon: 'bitcoin' },
      { symbol: 'ETH', name: 'Ethereum', buy: coinRes.ethereum.try * 0.995, sell: coinRes.ethereum.try * 1.005, icon: 'ethereum' },
    ];

    cachedPrices = prices;
    lastFetch = now;
    return prices;
  } catch { return []; }
}

export async function loadInvestments(): Promise<Investment[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveInvestments(list: Investment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
