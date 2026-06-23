import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MarketPrice {
  symbol: string;
  name: string;
  buy: number;
  sell: number;
  change: number;
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
let lastPrices: MarketPrice[] = [];
let lastFetch = 0;

export async function fetchMarketPrices(): Promise<MarketPrice[]> {
  const now = Date.now();
  if (now - lastFetch < 15000 && cachedPrices.length) return cachedPrices;

  try {
    const exchangeRatesRes = fetch('https://api.exchangerate-api.com/v4/latest/TRY').then(r => r.ok ? r.json() : Promise.reject());
    const goldRes = fetch('https://api.gold-api.com/price/XAU').then(r => r.ok ? r.json() : Promise.reject());
    const coinRes = fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,cardano&vs_currencies=try').then(r => r.ok ? r.json() : Promise.reject());

    const [exchangeData, goldData, coinData] = await Promise.all([exchangeRatesRes, goldRes, coinRes]);

    const usdSell = 1 / exchangeData.rates.USD;
    const eurSell = 1 / exchangeData.rates.EUR;
    const goldOzUsd = goldData.price;
    const gramAltinSell = (goldOzUsd * usdSell) / 31.1;

    const newPrices = [
      { symbol: 'USD', name: 'Dolar', buy: usdSell * 0.995, sell: usdSell, change: 0, icon: 'currency-usd' },
      { symbol: 'EUR', name: 'Euro', buy: eurSell * 0.995, sell: eurSell, change: 0, icon: 'currency-eur' },
      { symbol: 'GA', name: 'Gram Altın', buy: gramAltinSell * 0.995, sell: gramAltinSell, change: 0, icon: 'gold' },
      { symbol: 'BTC', name: 'Bitcoin', buy: coinData.bitcoin.try * 0.995, sell: coinData.bitcoin.try * 1.005, change: 0, icon: 'bitcoin' },
      { symbol: 'ETH', name: 'Ethereum', buy: coinData.ethereum.try * 0.995, sell: coinData.ethereum.try * 1.005, change: 0, icon: 'ethereum' },
    ];

    if (lastPrices.length) {
      newPrices.forEach(p => {
        const prev = lastPrices.find(x => x.symbol === p.symbol);
        if (prev && prev.sell > 0) p.change = ((p.sell - prev.sell) / prev.sell) * 100;
      });
    }

    lastPrices = cachedPrices;
    cachedPrices = newPrices;
    lastFetch = now;
    return newPrices;
  } catch {
    return [];
  }
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
