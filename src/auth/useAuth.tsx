import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isApiConfigured } from '../api/client';

interface AuthState {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  oauthError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  clearOauthError: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function getApiUrl(): string {
  // Capture API_URL at call time so tests can mutate import.meta.env per-test.
  return ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');
}

function readUrlError(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const code = params.get('error') ?? hashParams.get('error');
  const desc = params.get('error_description') ?? hashParams.get('error_description');
  if (!code) return null;
  if (code === 'access_denied') return 'Sign-in with Google was not completed. Try again or use email.';
  if (desc) return desc.replace(/\+/g, ' ');
  return `Google could not complete sign-in (${code}). Please try again.`;
}

function stripUrlError() {
  if (typeof window === 'undefined') return;
  const queryParams = new URLSearchParams(window.location.search);
  const hashRaw = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hashRaw);

  const queryHadError = queryParams.has('error') || queryParams.has('error_description');
  const hashHadError = hashParams.has('error') || hashParams.has('error_description');
  if (!queryHadError && !hashHadError) return;

  // Drop only the OAuth error keys; preserve everything else (e.g. ?tab=signup).
  for (const key of ['error', 'error_description', 'error_code']) {
    queryParams.delete(key);
    hashParams.delete(key);
  }
  const cleanedQuery = queryParams.toString();
  const cleanedHash = hashParams.toString();

  const url =
    window.location.pathname +
    (cleanedQuery ? `?${cleanedQuery}` : '') +
    (cleanedHash ? `#${cleanedHash}` : '');
  window.history.replaceState({}, '', url);
}

interface ProfileSyncPayload {
  fullName: string;
  avatarUrl: string | null;
}

function deriveProfileFromSession(session: Session): ProfileSyncPayload {
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    session.user.email?.split('@')[0] ||
    'User';
  const avatar =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null;
  return { fullName: name, avatarUrl: avatar };
}

async function syncProfile(session: Session): Promise<void> {
  if (!isApiConfigured) return;
  const apiUrl = getApiUrl();
  const body = deriveProfileFromSession(session);
  try {
    const res = await fetch(`${apiUrl}/api/me/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('[auth] profile sync failed', res.status);
    }
  } catch (err) {
    console.warn('[auth] profile sync error', err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const lastSyncedSubRef = useRef<string | null>(null);

  useEffect(() => {
    // Capture and strip any OAuth error from the URL on mount.
    const err = readUrlError();
    if (err) {
      setOauthError(err);
      stripUrlError();
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' && s) {
        // Adoption signal — see specs/001/research.md §R8.
        console.info({
          event: 'auth.signin',
          provider: (s.user.app_metadata?.provider as string | undefined) ?? 'unknown',
          sub: s.user.id,
          ts: Date.now(),
        });
        // Idempotent profile sync; one fire per fresh sub to avoid duplicate POSTs on tab focus.
        if (lastSyncedSubRef.current !== s.user.id) {
          lastSyncedSubRef.current = s.user.id;
          void syncProfile(s);
        }
      } else if (event === 'SIGNED_OUT') {
        lastSyncedSubRef.current = null;
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const clearOauthError = useCallback(() => setOauthError(null), []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured,
      oauthError,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      },
      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return error ? { error: error.message } : {};
      },
      signInWithGoogle: async () => {
        const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: redirectTo ? { redirectTo } : undefined,
        });
        return error ? { error: error.message } : {};
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      clearOauthError,
    }),
    [session, loading, oauthError, clearOauthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
