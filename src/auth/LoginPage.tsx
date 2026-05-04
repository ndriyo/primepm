import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import './login.css';

export function LoginPage() {
  const { signIn, signUp } = useAuth();

  const initialMode = (): 'signin' | 'signup' => {
    const p = new URLSearchParams(window.location.search);
    return p.get('signup') === '1' || p.get('tab') === 'signup' ? 'signup' : 'signin';
  };

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('signup') === '1' || p.get('tab') === 'signup') setMode('signup');
  }, []);

  function switchMode(m: 'signin' | 'signup') {
    setMode(m);
    setError(null);
    setInfo(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    if (err) setError(err);
    else if (mode === 'signup') setInfo('Check your email to confirm your account.');
    setBusy(false);
  }

  function ssoPlaceholder(provider: string) {
    setError(`${provider} SSO is not configured. Please sign in with email.`);
  }

  const isSignup = mode === 'signup';

  return (
    <div className="pp-login">
      {/* ── Form side ── */}
      <div className="pp-login-form-side">
        <a href="/" className="pp-login-brand">
          <span className="mark">P</span>
          <span>PrimePM<em>·pmo</em></span>
        </a>

        <div className="pp-login-card">
          <h1>
            {isSignup
              ? <>Create your <em>workspace.</em></>
              : <>Welcome back<em>.</em></>}
          </h1>
          <p className="sub">
            {isSignup
              ? 'Spin up a PMO command center in under a minute.'
              : 'Sign in to your portfolio command center.'}
          </p>

          {/* SSO buttons */}
          <div className="pp-sso-row">
            <button type="button" className="pp-sso-btn" onClick={() => ssoPlaceholder('Google')}>
              <svg className="gico" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 1 1-3.3-12.9l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.3 0 10-2 13.6-5.3l-6.3-5.3A12 12 0 0 1 12.7 28l-6.6 5A20 20 0 0 0 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.4l6.3 5.3c-.5.5 6.7-4.9 6.7-14.7 0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
              Google
            </button>
            <button type="button" className="pp-sso-btn" onClick={() => ssoPlaceholder('Microsoft')}>
              <svg className="gico" viewBox="0 0 24 24">
                <rect x="2" y="2" width="9" height="9" fill="#F25022"/>
                <rect x="13" y="2" width="9" height="9" fill="#7FBA00"/>
                <rect x="2" y="13" width="9" height="9" fill="#00A4EF"/>
                <rect x="13" y="13" width="9" height="9" fill="#FFB900"/>
              </svg>
              Microsoft
            </button>
          </div>

          <div className="pp-divider-or">or with email</div>

          {info && <div className="pp-info">{info}</div>}

          <form onSubmit={submit} noValidate>
            <div className={`pp-field${error ? '' : ''}`}>
              <label htmlFor="pp-email">Work email</label>
              <input
                id="pp-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
              />
            </div>

            {isSignup && (
              <div className="pp-field">
                <label htmlFor="pp-org">Organization</label>
                <input
                  id="pp-org"
                  type="text"
                  placeholder="Acme PMO"
                  autoComplete="organization"
                />
              </div>
            )}

            <div className="pp-field">
              <label htmlFor="pp-password">
                <span>Password</span>
                {!isSignup && (
                  <a href="#" onClick={e => { e.preventDefault(); setInfo('Password reset is not available in this demo.'); }}>Forgot?</a>
                )}
              </label>
              <input
                id="pp-password"
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? 'Choose a strong password' : '••••••••••'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
              />
            </div>

            {!isSignup && (
              <label className="pp-checkbox">
                <input type="checkbox" defaultChecked />
                Remember me on this device
              </label>
            )}

            {error && <div className="pp-field error"><div className="pp-err">{error}</div></div>}

            <button type="submit" className="pp-btn-submit" disabled={busy}>
              {busy ? (
                <span className="pp-dots-load"><span></span><span></span><span></span></span>
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Sign in'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            <p className="pp-foot-note">
              {isSignup
                ? <>Already have an account? <button type="button" onClick={() => switchMode('signin')}>Sign in →</button></>
                : <>New to PrimePM? <button type="button" onClick={() => switchMode('signup')}>Create an account →</button></>}
            </p>
          </form>
        </div>

        <div className="pp-login-foot">
          <span>© 2026 PrimePM Inc.</span>
          <span><a href="#">Privacy</a> · <a href="#">Terms</a></span>
        </div>
      </div>

      {/* ── Visual side ── */}
      <div className="pp-login-visual-side">
        <div className="pp-lv-brand">
          <span className="mark">P</span>
          <span>PrimePM<em>·pmo</em></span>
        </div>

        <div>
          <div className="pp-lv-quote">
            Monday briefings used to take three analysts and a weekend. Now they take eight minutes.
          </div>
          <div className="pp-lv-attr">
            <span className="av">DR</span>
            <span><strong style={{ color: '#FAFAF9', fontWeight: 500 }}>Daniela Reyes</strong> — VP Commercial Excellence, Northwind Group</span>
          </div>
        </div>

        <div className="pp-lv-meta">
          <div>
            <strong>2,400+</strong>
            <span>active portfolios</span>
          </div>
          <div>
            <strong>$1.8B</strong>
            <span>governed in flight</span>
          </div>
          <div>
            <strong>SOC 2</strong>
            <span>Type II certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
