import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { Centered } from '../components/Centered';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Could not send the reset email.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Centered title="Check your email">
        <p className="notice">
          If an account exists for <strong>{email}</strong>, a password-reset link is on its way.
        </p>
        <Link to="/sign-in">
          <button className="ghost">Back to sign in</button>
        </Link>
      </Centered>
    );
  }

  return (
    <Centered title="Reset your password">
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
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="muted" style={{ fontSize: 13 }}>
        <Link to="/sign-in">Back to sign in</Link>
      </p>
    </Centered>
  );
}
