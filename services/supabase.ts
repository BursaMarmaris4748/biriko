import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

const SUPABASE_URL = 'https://zvcveujspwpfthyqqsaz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Rbklw1jab3mikWf6ZDL3qg_i1xbWd69';

WebBrowser.maybeCompleteAuthSession();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const googleRedirectUri = makeRedirectUri({
  scheme: 'biriko',
  path: 'auth/callback',
});

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: googleRedirectUri,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) return { error: error.message };
  if (!data.url) return { error: 'OAuth URL alınamadı' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, googleRedirectUri);

  if (result.type !== 'success') {
    return { error: 'Giriş iptal edildi' };
  }

  const url = new URL(result.url);
  const fragments = new URLSearchParams(url.hash.replace('#', '?'));
  const accessToken = fragments.get('access_token');
  const refreshToken = fragments.get('refresh_token');

  if (accessToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });
    if (sessionError) return { error: sessionError.message };
  }

  return {};
}
