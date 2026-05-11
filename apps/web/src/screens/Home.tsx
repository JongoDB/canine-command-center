import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, BRANDING, breedLabel, type Dog } from '@ccc/shared';
import { signOut, useSession } from '../lib/auth-client';
import { api } from '../lib/api';
import { dogs as dogsApi } from '../lib/dogs';

type Health = 'checking' | 'ok' | 'down';

export function Home() {
  const navigate = useNavigate();
  const { data } = useSession();
  const [health, setHealth] = useState<Health>('checking');
  const [dogs, setDogs] = useState<Dog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api
      .health()
      .then((h) => live && setHealth(h.db === 'ok' ? 'ok' : 'down'))
      .catch(() => live && setHealth('down'));
    dogsApi
      .list()
      .then((d) => live && setDogs(d))
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 401) navigate('/sign-in', { replace: true });
        else setError(e instanceof Error ? e.message : 'Could not load your dogs.');
      });
    return () => {
      live = false;
    };
  }, [navigate]);

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
            onClick={async () => {
              await signOut();
              navigate('/sign-in', { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="content stack">
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div className="eyebrow">Your dogs</div>
            <h1 style={{ marginTop: 4 }}>Today</h1>
          </div>
          <Link to="/onboard">
            <button style={{ width: 'auto', padding: '8px 16px' }}>+ New dog</button>
          </Link>
        </div>

        {error && <div className="error">{error}</div>}

        {dogs === null ? (
          <span className="muted">Loading your dogs…</span>
        ) : dogs.length === 0 ? (
          <div className="notice">
            No dogs yet. <Link to="/onboard">Run intake</Link> to create one (we ship a Belgian
            Malinois × Dutch Shepherd default you can tap through, or start fresh).
          </div>
        ) : (
          <div className="stack">
            {dogs.map((d) => (
              <Link
                key={d.id}
                to={`/dogs/${d.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div
                      style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}
                    >
                      {d.name}
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {breedLabel(d.breed)} · {d.sex !== 'unknown' ? d.sex : ''}
                      {d.ageMonths !== null
                        ? ` · ${Math.floor(d.ageMonths / 12)}y ${d.ageMonths % 12}mo`
                        : ''}
                    </div>
                  </div>
                  <span className="pill">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: 4 }}>
          <Link to="/breeds" style={{ fontSize: 13 }}>
            Browse the breed library →
          </Link>
        </div>

        <div className="notice">
          The real Today / Program / {BRANDING.assistantName} / Health screens land in Phase 1 — see{' '}
          <code>docs/ROADMAP.md</code>.
        </div>
      </main>
    </div>
  );
}
