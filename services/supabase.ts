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

function parseHashParams(url: string) {
  const hash = url.split('#')[1] || '';
  const params: Record<string, string> = {};
  hash.split('&').forEach((part) => {
    const [k, v] = part.split('=');
    if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return params;
}

export async function signInWithGoogle() {
  const { makeRedirectUri } = await import('expo-auth-session');
  const WebBrowser = await import('expo-web-browser');

  WebBrowser.maybeCompleteAuthSession();

  const googleRedirectUri = makeRedirectUri({
    scheme: 'biriko',
    path: 'auth/callback',
  });

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: googleRedirectUri,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) return { error: error.message };
    if (!data?.url) return { error: 'OAuth URL alınamadı' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, googleRedirectUri);

    if (result.type !== 'success') {
      return { error: 'Giriş iptal edildi' };
    }

    const params = parseHashParams(result.url);
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;

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
