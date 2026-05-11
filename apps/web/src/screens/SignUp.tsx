import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { signUp } from '../lib/auth-client';
import { Centered } from '../components/Centered';

export function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signUp.email({ name, email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Sign-up failed.');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Centered title="Check your email">
        <p className="notice">
          We sent a verification link to <strong>{email}</strong>. Click it to activate your
          account, then sign in.
        </p>
        <Link to="/sign-in">
          <button className="ghost">Back to sign in</button>
        </Link>
      </Centered>
    );
  }

  return (
    <Centered title="Create your account">
      <form className="stack" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="muted" style={{ fontSize: 13 }}>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </Centered>
  );
}
