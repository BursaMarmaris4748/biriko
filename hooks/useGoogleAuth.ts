import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '573304848216-t8hf09cgff8kmhl0atl803sogekrc1gr.apps.googleusercontent.com';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const redirectUri = Linking.createURL('auth/callback');

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleSupported, setGoogleSupported] = useState(true);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (isExpoGo) {
      setGoogleSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!response) return;
    setLoading(false);

    if (response.type === 'error') {
      if (response.error?.message?.includes('not configured') || response.error?.message?.includes('redirect_uri')) {
        setError('Google girişi için yönlendirme URI\'si yapılandırılmamış. Lütfen Google Cloud Console\'da https://auth.expo.io/@omerarslan/biriko adresini Authorized redirect URIs\'e ekleyin.');
      } else {
        setError(response.error?.message || 'Google girişi başarısız');
      }
      return;
    }

    if (response.type !== 'success') return;

    const { id_token } = response.params;
    if (!id_token) {
      setError('Google kimlik doğrulama token\'ı alınamadı');
      return;
    }

    setError(null);
    supabase.auth
      .signInWithIdToken({ provider: 'google', token: id_token })
      .then(({ error }) => {
        if (error) setError(error.message);
      });
  }, [response]);

  const signIn = async () => {
    setError(null);

    if (isExpoGo) {
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        if (result.type === 'success') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) return;
        }
        if (result.type !== 'success') {
          setError('Expo Go\'da Google girişi başarısız. Lütfen EAS Development Build kullanın.');
          return;
        }
      }
      return;
    }

    setLoading(true);
    promptAsync();
  };

  return { signIn, loading, error, disabled: !request, googleSupported };
}
