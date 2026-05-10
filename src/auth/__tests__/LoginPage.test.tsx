import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const supabaseMock = vi.hoisted(() => {
  const state = {
    signInWithOAuth: vi.fn(async () => ({ data: {}, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
    signUp: vi.fn(async () => ({ data: {}, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    getSession: vi.fn(async () => ({ data: { session: null } })),
    listeners: [] as Array<(e: string, s: unknown) => void>,
  };
  return {
    state,
    onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
      state.listeners.push(cb);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  };
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

import { AuthProvider } from '../useAuth';
import { LoginPage } from '../LoginPage';

function renderAt(url: string) {
  window.history.replaceState({}, '', url);
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

beforeEach(() => {
  supabaseMock.state.signInWithOAuth.mockClear();
  supabaseMock.state.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
  supabaseMock.state.signInWithPassword.mockClear();
  supabaseMock.state.signUp.mockClear();
  supabaseMock.state.listeners.length = 0;
  window.history.replaceState({}, '', '/');
});
afterEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage — Google button (C1)', () => {
  it('renders "Continue with Google" on the sign-in tab', () => {
    renderAt('/?tab=signin');
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('renders "Continue with Google" on the sign-up tab', () => {
    renderAt('/?tab=signup');
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('click invokes signInWithOAuth({ provider: "google", options: { redirectTo } })', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(supabaseMock.state.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  });

  it('disables the Google button while in flight (subsequent click is a no-op)', async () => {
    let resolve: (v: { data: object; error: null }) => void = () => {};
    supabaseMock.state.signInWithOAuth.mockImplementationOnce(
      () => new Promise(r => { resolve = r; }),
    );
    renderAt('/');
    const btn = screen.getByRole('button', { name: /continue with google/i });
    await userEvent.click(btn);
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(supabaseMock.state.signInWithOAuth).toHaveBeenCalledTimes(1);
    resolve({ data: {}, error: null });
  });

  it('renders supabase errors in the pp-err row', async () => {
    supabaseMock.state.signInWithOAuth.mockResolvedValueOnce({
      data: {},
      error: { message: 'misconfigured' } as never,
    });
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(await screen.findByText('misconfigured')).toBeInTheDocument();
  });
});

describe('LoginPage — OAuth callback error (C2)', () => {
  it('renders the access_denied banner on mount and strips the URL', async () => {
    renderAt('/?error=access_denied');
    expect(await screen.findByText(/sign-in with google was not completed/i)).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });
});

describe('LoginPage — email/password regression (C5)', () => {
  // The email/password form structure must remain present and unchanged.
  // We assert structural facts pre/post Google addition rather than pixel snapshots.
  it('keeps the <form> and email + password inputs with their autoComplete contracts', () => {
    renderAt('/?tab=signin');
    expect(document.querySelector('form')).not.toBeNull();
    const emailInput = screen.getByLabelText(/work email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(emailInput.type).toBe('email');
    expect(emailInput.autocomplete).toBe('email');
    expect(passwordInput.type).toBe('password');
    expect(passwordInput.autocomplete).toBe('current-password');
  });

  it('keeps the "Forgot?" link in signin mode', () => {
    renderAt('/?tab=signin');
    expect(screen.getByText(/forgot/i)).toBeInTheDocument();
  });

  it('keeps the submit button labelled "Sign in" in signin mode', () => {
    renderAt('/?tab=signin');
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('keeps the submit button labelled "Create account" in signup mode', () => {
    renderAt('/?tab=signup');
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('signup mode adds the new-password autocomplete', () => {
    renderAt('/?tab=signup');
    const pw = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(pw.autocomplete).toBe('new-password');
  });
});
