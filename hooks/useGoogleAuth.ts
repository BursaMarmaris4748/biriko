import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const webClientId = '573304848216-t8hf09cgff8kmhl0atl803sogekrc1gr.apps.googleusercontent.com';

export function useGoogleAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const { id_token } = response.params;
    if (!id_token) return;

    setLoading(true);
    supabase.auth
      .signInWithIdToken({ provider: 'google', token: id_token })
      .then(({ error }) => {
        if (error) setError(error.message);
        else router.replace('/(tabs)');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [response]);

  const signIn = () => {
    setError(null);
    promptAsync();
  };

  return { signIn, loading, error, disabled: !request };
}
