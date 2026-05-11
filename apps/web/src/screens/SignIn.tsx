import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/auth-client';
import { Centered } from '../components/Centered';

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      const code = res.error.code ?? '';
      setError(
        /verif/i.test(code) || /verif/i.test(res.error.message ?? '')
          ? 'Your email isn’t verified yet — check your inbox for the link.'
          : (res.error.message ?? 'Sign-in failed.'),
      );
      return;
    }
    navigate(location.state?.from ?? '/', { replace: true });
  }

  return (
    <Centered title="Sign in">
      <form className="stack" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="muted" style={{ fontSize: 13 }}>
        <Link to="/forgot-password">Forgot password?</Link> · New here?{' '}
        <Link to="/sign-up">Create an account</Link>
      </p>
    </Centered>
  );
}
