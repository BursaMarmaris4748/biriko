import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, signInWithGoogle as googleSignIn } from './supabase';
import { Session, User } from '@supabase/supabase-js';

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

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) { clearTimeout(timeout); setLoading(false); } });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { cancelled = true; listener?.subscription.unsubscribe(); clearTimeout(timeout); };
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
