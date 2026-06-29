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

export interface StockHolding {
  id: string;
  symbol: string;
  exchange: 'BIST' | 'US';
  shares: number;
  costPerShare: number;
  date: string;
}

export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  history: number[];
}

const STORAGE_KEY = '@biriko/investments';
const STOCK_KEY = '@biriko/stocks';
const DAILY_OPEN_KEY = '@biriko/daily-open';

let cachedPrices: MarketPrice[] = [];
let lastFetch = 0;
let priceHistory: Record<string, number[]> = {};
let cachedStockPrices: Record<string, StockPrice> = {};
let lastStockFetch = 0;

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

export async function fetchStockHistory(symbol: string, range: '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y' = '1mo'): Promise<{ timestamp: number[]; close: number[]; high: number[]; low: number[] }> {
  const intervals: Record<string, string> = { '1d': '5m', '5d': '1d', '1mo': '1d', '3mo': '1wk', '1y': '1wk', '5y': '1mo' };
  try {
    const data = await safeFetch<any>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${intervals[range]}&range=${range}`);
    const result = data?.chart?.result?.[0];
    if (!result) return { timestamp: [], close: [], high: [], low: [] };
    const quotes = result.indicators?.quote?.[0];
    return {
      timestamp: result.timestamp || [],
      close: quotes?.close?.filter((c: number | null) => c !== null) || [],
      high: quotes?.high?.filter((h: number | null) => h !== null) || [],
      low: quotes?.low?.filter((l: number | null) => l !== null) || [],
    };
  } catch { return { timestamp: [], close: [], high: [], low: [] }; }
}

export async function loadInvestments(): Promise<Investment[]> {
  try { const json = await AsyncStorage.getItem(STORAGE_KEY); return json ? JSON.parse(json) : []; }
  catch { return []; }
}

export async function saveInvestments(list: Investment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function loadStocks(): Promise<StockHolding[]> {
  try { const json = await AsyncStorage.getItem(STOCK_KEY); return json ? JSON.parse(json) : []; }
  catch { return []; }
}

export async function saveStocks(list: StockHolding[]): Promise<void> {
  await AsyncStorage.setItem(STOCK_KEY, JSON.stringify(list));
}

const STOCK_NAMES: Record<string, string> = {
  THYAO: 'Türk Hava Yolları', GARAN: 'Garanti BBVA', AKBNK: 'Akbank',
  EREGL: 'Ereğli Demir Çelik', TUPRS: 'Tüpraş', ASELS: 'Aselsan',
  KCHOL: 'Koç Holding', SAHOL: 'Sabancı Holding', FROTO: 'Ford Otosan',
  SISE: 'Şişe Cam', PGSUS: 'Pegasus', HEKTS: 'Hektaş',
  BİM: 'BİM Birleşik Mağazalar', TCELL: 'Turkcell', VAKBN: 'Vakıfbank',
  YKBNK: 'Yapı Kredi', ISCTR: 'İş Bankası', SOKM: 'Şok Marketler',
  MGROS: 'Migros', KOZAA: 'Koza Altın',
  AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Alphabet',
  AMZN: 'Amazon', NVDA: 'NVIDIA', META: 'Meta',
  TSLA: 'Tesla', JPM: 'JPMorgan Chase', V: 'Visa',
  SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ Trust', AMD: 'AMD',
};

function guessStockName(symbol: string): string {
  if (STOCK_NAMES[symbol]) return STOCK_NAMES[symbol];
  const clean = symbol.replace('.IS', '');
  if (STOCK_NAMES[clean]) return STOCK_NAMES[clean];
  return symbol;
}

export async function fetchStockPrices(holdings: StockHolding[]): Promise<StockPrice[]> {
  if (!holdings.length) return [];

  const now = Date.now();
  if (now - lastStockFetch < 20000 && Object.keys(cachedStockPrices).length) {
    return holdings.map(h => cachedStockPrices[h.symbol]).filter(Boolean);
  }

  const uniqueSymbols = [...new Set(holdings.map(h => h.exchange === 'BIST' ? `${h.symbol}.IS` : h.symbol))];
  if (!uniqueSymbols.length) return [];

  const priceMap: Record<string, StockPrice> = { ...cachedStockPrices };

  const results = await Promise.allSettled(
    uniqueSymbols.map(sym =>
      safeFetch<any>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`
      ).then(data => {
        const result = data?.chart?.result?.[0];
        if (!result) return null;
        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];
        const closes = quotes?.close?.filter((c: number | null) => c !== null) || [];
        const cleanSym = sym.replace('.IS', '');
        return {
          symbol: cleanSym,
          name: guessStockName(cleanSym),
          price: meta.regularMarketPrice ?? 0,
          previousClose: meta.previousClose ?? meta.chartPreviousClose ?? 0,
          change: (meta.regularMarketPrice ?? 0) - (meta.previousClose ?? meta.chartPreviousClose ?? 0),
          changePercent: meta.previousClose ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 : 0,
          currency: meta.currency || 'TRY',
          history: closes,
        } as StockPrice;
      })
    )
  );

  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      priceMap[r.value.symbol] = r.value;
      if (!priceHistory[r.value.symbol]) priceHistory[r.value.symbol] = [];
      if (r.value.price > 0) {
        priceHistory[r.value.symbol].push(r.value.price);
        if (priceHistory[r.value.symbol].length > 20) priceHistory[r.value.symbol].shift();
      }
    }
  });

  cachedStockPrices = priceMap;
  lastStockFetch = now;

  return holdings.map(h => {
    const sp = priceMap[h.symbol];
    if (sp) return { ...sp, history: [...(priceHistory[h.symbol] || [])] };
    return { symbol: h.symbol, name: guessStockName(h.symbol), price: 0, previousClose: 0, change: 0, changePercent: 0, currency: 'TRY', history: [] };
  });
}
