import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRANDING } from '@ccc/shared';
import { authClient, signOut, useSession } from '../lib/auth-client';

export function Settings() {
  const navigate = useNavigate();
  const { data } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (
      !confirm(
        'Delete your account and all your data (dogs, intake, chats)? This cannot be undone.',
      )
    )
      return;
    setDeleting(true);
    setError(null);
    const res = await authClient.deleteUser({});
    setDeleting(false);
    if (res.error) {
      setError(res.error.message ?? 'Could not delete your account.');
      return;
    }
    navigate('/sign-in', { replace: true });
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          {BRANDING.appNameShort}
        </Link>
        <Link to="/" style={{ fontSize: 13 }}>
          ← Home
        </Link>
      </header>

      <main className="content stack" style={{ maxWidth: 560 }}>
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Account</h1>
        </div>

        <div className="card stack">
          <div>
            <label>Email</label>
            <div style={{ fontSize: 14 }}>{data?.user?.email ?? '—'}</div>
          </div>
          <div>
            <label>Name</label>
            <div style={{ fontSize: 14 }}>{data?.user?.name ?? '—'}</div>
          </div>
          <div>
            <label>Email verified</label>
            <div style={{ fontSize: 14 }}>{data?.user?.emailVerified ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="card stack">
          <h2 style={{ fontSize: 18 }}>Notifications</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Reminders for vaccines, meds, checkups, training tasks, grooming — coming with the
            reminders engine (Phase 3).
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="ghost"
            style={{ flex: 1 }}
            onClick={async () => {
              await signOut();
              navigate('/sign-in', { replace: true });
            }}
          >
            Sign out
          </button>
          <button onClick={onDelete} disabled={deleting} style={{ flex: 1 }}>
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </main>
    </div>
  );
}
