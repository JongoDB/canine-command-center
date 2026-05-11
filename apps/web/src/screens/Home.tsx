import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRANDING } from '@ccc/shared';
import { signOut, useSession } from '../lib/auth-client';
import { api } from '../lib/api';

type Health = 'checking' | 'ok' | 'down';

export function Home() {
  const navigate = useNavigate();
  const { data } = useSession();
  const [health, setHealth] = useState<Health>('checking');

  useEffect(() => {
    let live = true;
    api
      .health()
      .then((h) => live && setHealth(h.db === 'ok' ? 'ok' : 'down'))
      .catch(() => live && setHealth('down'));
    return () => {
      live = false;
    };
  }, []);

  async function onSignOut() {
    await signOut();
    navigate('/sign-in', { replace: true });
  }

  return (
    <div className="screen">
      <header className="appbar">
        <span className="brand">{BRANDING.appNameShort}</span>
        <div className="right">
          <span className={`pill ${health === 'ok' ? 'ok' : health === 'down' ? 'down' : ''}`}>
            API {health}
          </span>
          <span className="muted">{data?.user?.email}</span>
          <button
            className="ghost"
            style={{ width: 'auto', padding: '6px 12px' }}
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="content stack">
        <div>
          <div className="eyebrow">Home</div>
          <h1>You’re in.</h1>
        </div>
        <p className="muted" style={{ maxWidth: 560 }}>
          This is the skeleton — auth is wired end to end. Next up: dog intake, the breed-aware
          training program, the health timeline, and {BRANDING.assistantName} (your in-app expert).
        </p>
        <div className="notice">
          Roadmap: <code>docs/ROADMAP.md</code> · Progress: <code>docs/BUILDLOG.md</code> — the real
          screens (Today · Program · {BRANDING.assistantName} · Health · More) land in Phase 1.
        </div>
      </main>
    </div>
  );
}
