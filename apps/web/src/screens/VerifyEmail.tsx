import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Centered } from '../components/Centered';
import { API_BASE_URL } from '../lib/config';

/**
 * Landing page for the verification email link (`/verify-email?token=…`).
 * Hands the token to the API's GET verify endpoint via a full-page navigation,
 * with `callbackURL` pointing back at this app — the API verifies, sets the
 * session cookie (auto sign-in), and redirects here.
 */
export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [tooSlow, setTooSlow] = useState(false);

  useEffect(() => {
    if (!token) return;
    const callbackURL = `${window.location.origin}/`;
    window.location.replace(
      `${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`,
    );
    const t = setTimeout(() => setTooSlow(true), 6000);
    return () => clearTimeout(t);
  }, [token]);

  if (!token) {
    return (
      <Centered title="Verify your email">
        <p className="error">This link is missing its token. Try the link in your email again.</p>
        <Link to="/sign-in">
          <button className="ghost">Back to sign in</button>
        </Link>
      </Centered>
    );
  }

  return (
    <Centered title="Verifying your email…">
      <p className="muted">One moment — confirming your address.</p>
      {tooSlow && (
        <>
          <p className="error">Taking longer than expected. The link may have expired.</p>
          <Link to="/sign-in">
            <button className="ghost">Back to sign in</button>
          </Link>
        </>
      )}
    </Centered>
  );
}
