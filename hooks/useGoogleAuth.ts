import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

function parseUrlParams(url: string): Record<string, string> {
  const hash = url.split('#')[1] || url.split('?')[1] || '';
  const params: Record<string, string> = {};
  hash.split('&').forEach((part) => {
    const [k, v] = part.split('=');
    if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return params;
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const redirectTo = 'biriko://auth/callback';

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (oauthError) { setError(oauthError.message); setLoading(false); return; }
      if (!data?.url) { setError('OAuth URL alınamadı'); setLoading(false); return; }

      const result = await WebBrowser.openAuthSessionAsync(data.url);

      if (result.type !== 'success') {
        setError('Giriş iptal edildi');
        setLoading(false);
        return;
      }

      const params = parseUrlParams(result.url);
      const accessToken = params.access_token;
      if (!accessToken) { setError('Token alınamadı'); setLoading(false); return; }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: params.refresh_token || '',
      });

      if (sessionError) setError(sessionError.message);
    } catch (e: any) {
      setError(e?.message || 'Google girişi başarısız');
    }
    setLoading(false);
  };

  return { signIn, loading, error, disabled: false };
}
