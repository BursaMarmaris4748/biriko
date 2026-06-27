import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://zvcveujspwpfthyqqsaz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Rbklw1jab3mikWf6ZDL3qg_i1xbWd69';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

function extractParam(url: string, key: string): string | null {
  const params = (url.split('#')[1] || url.split('?')[1] || '').split('&');
  for (const part of params) {
    const [k, v] = part.split('=');
    if (k === key && v) return decodeURIComponent(v);
  }
  return null;
}

export async function signInWithGoogle() {
  const WebBrowser = await import('expo-web-browser');
  const { createURL } = await import('expo-linking');
  WebBrowser.maybeCompleteAuthSession();

  try {
    const redirectTo = createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) return { error: error.message };
    if (!data?.url) return { error: 'OAuth URL alınamadı' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success') {
      return { error: 'Giriş iptal edildi' };
    }

    const accessToken = extractParam(result.url, 'access_token');
    const refreshToken = extractParam(result.url, 'refresh_token');

    if (!accessToken) return { error: 'Token alınamadı' };

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError) return { error: sessionError.message };
    return {};
  } catch (e: any) {
    return { error: e?.message || 'Google girişi başarısız' };
  }
}
