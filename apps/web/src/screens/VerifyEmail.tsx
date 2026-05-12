import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { Centered } from '../components/Centered';

/**
 * Verify the email address with the 6-digit code from the verification email.
 * The email also carries a link that pre-fills `?email=&code=` — when both are
 * present we submit automatically; otherwise the owner types the code (handy
 * when the email opened on a different device/browser).
 */
export function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState((params.get('code') ?? '').replace(/\D/g, '').slice(0, 6));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const autoTried = useRef(false);

  async function verify(e?: FormEvent) {
    e?.preventDefault();
    if (!email.trim() || code.length < 6) {
      setError('Enter your email and the 6-digit code from the email.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await authClient.emailOtp.verifyEmail({ email: email.trim(), otp: code });
    setBusy(false);
    if (res.error) {
      setError(
        res.error.message ?? 'That code didn’t work — it may have expired. Send a new one below.',
      );
      return;
    }
    // Verified (and signed in if the plugin set a session). Home will show the
    // dog list / redirect to onboard if signed in, or to /sign-in if not.
    navigate('/', { replace: true });
  }

  // Auto-submit once when the email link pre-filled both fields.
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const e = (params.get('email') ?? '').trim();
    const c = (params.get('code') ?? '').replace(/\D/g, '');
    if (e && c.length === 6) void verify();
  }, [params]);

  async function resend() {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    setError(null);
    setResent(false);
    const res = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: 'email-verification',
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Could not send a new code.');
      return;
    }
    setResent(true);
  }

  return (
    <Centered title="Verify your email">
      <p className="muted" style={{ fontSize: 13 }}>
        Enter the 6-digit code we emailed you — or click the link in that email and we’ll fill it in
        for you.
      </p>
      <form className="stack" onSubmit={verify}>
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
          <label htmlFor="code">6-digit code</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        {resent && <div className="notice">A new code is on its way to {email}.</div>}
        <button type="submit" disabled={busy || !email.trim() || code.length < 6}>
          {busy ? 'Verifying…' : 'Verify email'}
        </button>
      </form>
      <p className="muted" style={{ fontSize: 13 }}>
        Didn’t get it?{' '}
        <button
          className="ghost"
          type="button"
          style={{ width: 'auto', padding: '2px 10px', display: 'inline-block' }}
          onClick={resend}
          disabled={busy}
        >
          Send a new code
        </button>
      </p>
      <Link to="/sign-in" style={{ fontSize: 13 }}>
        Back to sign in
      </Link>
    </Centered>
  );
}
