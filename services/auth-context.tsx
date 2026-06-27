import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, signInWithGoogle as googleSignIn, parseUrlParams } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false); }, 5000);

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) { setSession(session); setUser(session.user); clearTimeout(timeout); setLoading(false); return; }

      const initialUrl = await Linking.getInitialURL();
      if (!initialUrl || !initialUrl.includes('auth/callback')) {
        clearTimeout(timeout); setLoading(false); return;
      }
      const params = parseUrlParams(initialUrl);
      const accessToken = params.access_token;
      if (!accessToken) { clearTimeout(timeout); setLoading(false); return; }
      const { data: { session: newSession } } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: params.refresh_token || '',
      });
      if (!cancelled) { setSession(newSession); setUser(newSession?.user ?? null); clearTimeout(timeout); setLoading(false); }
    };

    initSession().catch(() => { if (!cancelled) { clearTimeout(timeout); setLoading(false); } });

    const { data: onAuthListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { cancelled = true; onAuthListener?.subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e?.message || 'Giriş yapılamadı' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e?.message || 'Kayıt yapılamadı' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return await googleSignIn();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
