import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// Hoisted mock state — shared between vi.mock factories and tests.
const supabaseMock = vi.hoisted(() => {
  type AuthChangeListener = (event: string, session: unknown) => void;
  const state = {
    listeners: [] as AuthChangeListener[],
    signInWithOAuth: vi.fn(async (_args: unknown) => ({ data: {}, error: null })),
    signInWithPassword: vi.fn(async (_args: unknown) => ({ data: {}, error: null })),
    signUp: vi.fn(async (_args: unknown) => ({ data: {}, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    getSession: vi.fn(async () => ({ data: { session: null } })),
  };
  const onAuthStateChange = (cb: AuthChangeListener) => {
    state.listeners.push(cb);
    return { data: { subscription: { unsubscribe: () => {} } } };
  };
  function emit(event: string, session: unknown) {
    state.listeners.forEach(l => l(event, session));
  }
  return { state, onAuthStateChange, emit };
});

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: supabaseMock.state.getSession,
      onAuthStateChange: supabaseMock.onAuthStateChange,
      signInWithOAuth: supabaseMock.state.signInWithOAuth,
      signInWithPassword: supabaseMock.state.signInWithPassword,
      signUp: supabaseMock.state.signUp,
      signOut: supabaseMock.state.signOut,
    },
  },
  isSupabaseConfigured: true,
}));

// Force isApiConfigured=true so syncProfile attempts the (mocked) fetch.
vi.mock('../../api/client', () => ({ isApiConfigured: true }));

import { AuthProvider, useAuth } from '../useAuth';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  supabaseMock.state.signInWithOAuth.mockClear();
  supabaseMock.state.signInWithPassword.mockClear();
  supabaseMock.state.signUp.mockClear();
  supabaseMock.state.getSession.mockClear();
  supabaseMock.state.getSession.mockResolvedValue({ data: { session: null } });
  supabaseMock.state.listeners.length = 0;
  // Reset URL to a clean sign-in page before each test.
  window.history.replaceState({}, '', '/');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useAuth — signInWithGoogle (C1)', () => {
  it('calls signInWithOAuth with provider=google and redirectTo=window.location.origin', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(supabaseMock.state.signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(supabaseMock.state.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  });

  it('returns the supabase error message verbatim', async () => {
    supabaseMock.state.signInWithOAuth.mockResolvedValueOnce({
      data: {},
      error: { message: 'configuration error' } as never,
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    let res: { error?: string } = {};
    await act(async () => {
      res = await result.current.signInWithGoogle();
    });
    expect(res.error).toBe('configuration error');
  });
});

describe('useAuth — URL error capture (C2)', () => {
  it('captures ?error=access_denied and strips it from the URL', async () => {
    window.history.replaceState({}, '', '/?error=access_denied&error_description=user+cancelled');
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.oauthError).toBeTruthy());
    expect(result.current.oauthError).toMatch(/not completed/i);
    expect(window.location.search).toBe('');
  });

  it('captures #error=server_error from the URL hash', async () => {
    window.history.replaceState({}, '', '/#error=server_error&error_description=Boom');
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.oauthError).toBeTruthy());
    // Hash params produce the description text; assert a non-empty message present.
    expect(result.current.oauthError && result.current.oauthError.length > 0).toBe(true);
  });

  // Regression for PR review #1: preserve non-error query params (e.g. ?tab=signup)
  // when stripping the OAuth error.
  it('preserves non-error query params when stripping the OAuth error', async () => {
    window.history.replaceState({}, '', '/?tab=signup&error=access_denied&error_description=user+cancelled');
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.oauthError).toBeTruthy());
    expect(window.location.search).toBe('?tab=signup');
  });

  it('is a no-op when no error params are present', async () => {
    const spy = vi.spyOn(window.history, 'replaceState');
    renderHook(() => useAuth(), { wrapper });
    // Allow effects to run.
    await waitFor(() => expect(supabaseMock.state.getSession).toHaveBeenCalled());
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('useAuth — profile sync on SIGNED_IN (C3)', () => {
  function fakeSession(meta: Record<string, unknown> = {}, sub = 'user-123', email = 'u@e.com') {
    return {
      access_token: 'tok-abc',
      refresh_token: 'r',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: sub,
        email,
        user_metadata: meta,
        app_metadata: { provider: 'google' },
      },
    };
  }

  it('PUTs /api/me/profile with derived fullName + avatarUrl when SIGNED_IN', async () => {
    renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(supabaseMock.state.getSession).toHaveBeenCalled());

    await act(async () => {
      supabaseMock.emit('SIGNED_IN', fakeSession({
        full_name: 'Daniela Reyes',
        avatar_url: 'https://lh3.googleusercontent.com/abc',
      }));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/me/profile');
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer tok-abc');
    expect(JSON.parse(init.body)).toEqual({
      fullName: 'Daniela Reyes',
      avatarUrl: 'https://lh3.googleusercontent.com/abc',
    });
  });

  it('sends avatarUrl=null when Google profile has no avatar', async () => {
    renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      supabaseMock.emit('SIGNED_IN', fakeSession({ name: 'Solo' }, 'sub-2', 'solo@e.com'));
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      fullName: 'Solo',
      avatarUrl: null,
    });
  });

  it('logs console.warn but does not throw when the sync POST fails (500)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      supabaseMock.emit('SIGNED_IN', fakeSession({ full_name: 'D', avatar_url: 'https://x/y' }));
    });
    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });

  it('does NOT call PUT /api/me/profile on SIGNED_OUT', async () => {
    renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      supabaseMock.emit('SIGNED_OUT', null);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // US2 — returning email/password user gets profile refreshed on Google sign-in
  it('updates the profile again when the same user re-signs-in with new metadata', async () => {
    renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      supabaseMock.emit('SIGNED_IN', fakeSession({ full_name: 'Old', avatar_url: 'https://a' }, 'u1'));
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // Sign out clears the dedup ref so the next SIGNED_IN re-syncs.
    await act(async () => {
      supabaseMock.emit('SIGNED_OUT', null);
    });
    await act(async () => {
      supabaseMock.emit('SIGNED_IN', fakeSession({ full_name: 'New', avatar_url: 'https://b' }, 'u1'));
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      fullName: 'New',
      avatarUrl: 'https://b',
    });
  });
});

describe('useAuth — email/password regression (C5)', () => {
  it('signIn(email, password) returns { error?: string } with no shape change', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let res: { error?: string } = {};
    await act(async () => {
      res = await result.current.signIn('a@b.com', 'hunter22');
    });
    expect(supabaseMock.state.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'hunter22',
    });
    expect(res).toEqual({});
  });

  it('signUp(email, password) returns { error?: string } with no shape change', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let res: { error?: string } = {};
    await act(async () => {
      res = await result.current.signUp('a@b.com', 'hunter22');
    });
    expect(supabaseMock.state.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'hunter22',
    });
    expect(res).toEqual({});
  });
});

describe('useAuth — provider must be wrapped', () => {
  it('throws when used outside AuthProvider', () => {
    function Bare() {
      useAuth();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/inside AuthProvider/);
  });
});
