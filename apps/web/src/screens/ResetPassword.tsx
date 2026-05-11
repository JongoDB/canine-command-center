import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { Centered } from '../components/Centered';

/** Landing page for the password-reset email link (`/reset-password?token=…`). */
export function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    const res = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Could not reset your password — the link may have expired.');
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/sign-in', { replace: true }), 1500);
  }

  if (!token) {
    return (
      <Centered title="Reset your password">
        <p className="error">This link is missing its token. Request a new reset email.</p>
        <Link to="/forgot-password">
          <button className="ghost">Send a new link</button>
        </Link>
      </Centered>
    );
  }

  return (
    <Centered title="Set a new password">
      {done ? (
        <p className="notice">Password updated — taking you to sign in…</p>
      ) : (
        <form className="stack" onSubmit={onSubmit}>
          <div>
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </Centered>
  );
}
