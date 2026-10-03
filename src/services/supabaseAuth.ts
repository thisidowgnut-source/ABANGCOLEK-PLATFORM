/**
 * Supabase Authentication Service & Hook for ABANGCOLEK-OS
 * Project Ref: bktksvhcgszaoqkdyhil
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface SupabaseAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  quickStaffSignIn: (role?: 'hq_admin' | 'stockist_kt' | 'crew_toppen') => Promise<void>;
}

export function useSupabaseAuth(): SupabaseAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        setError(error.message);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(err => {
      if (!mounted) return;
      setError(err?.message || 'Error fetching Supabase session');
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      setSession(data.session);
    }
    setLoading(false);
    return { user: data.user, error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      setSession(data.session);
    }
    setLoading(false);
    return { user: data.user, error };
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    setLoading(false);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      setUser(null);
      setSession(null);
    }
    setLoading(false);
    return { error };
  }, []);

  /** Roles are granted by canonical membership; no simulated provider identity. */
  const quickStaffSignIn = useCallback(async (role: 'hq_admin' | 'stockist_kt' | 'crew_toppen' = 'hq_admin') => {
    setError(`Akses ${role} memerlukan login sebenar dan membership yang diberi oleh founder.`);
    setLoading(false);
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOtp,
    signOut,
    quickStaffSignIn
  };
}
