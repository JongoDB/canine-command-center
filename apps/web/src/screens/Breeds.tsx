import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, BRANDING, energyLabel, type BreedProfileSummary } from '@ccc/shared';
import { breeds } from '../lib/breeds';
import { signOut, useSession } from '../lib/auth-client';

export function Breeds() {
  const navigate = useNavigate();
  const { data } = useSession();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<BreedProfileSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    const t = setTimeout(() => {
      breeds
        .list(search)
        .then((b) => live && setResults(b))
        .catch((e: unknown) => {
          if (!live) return;
          if (e instanceof ApiError && e.status === 401) navigate('/sign-in', { replace: true });
          else setError(e instanceof Error ? e.message : 'Could not load breeds.');
        });
    }, 150); // tiny debounce while typing
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [search, navigate]);

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          {BRANDING.appNameShort}
        </Link>
        <div className="right">
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

      <main className="content stack" style={{ maxWidth: 720 }}>
        <div>
          <div className="eyebrow">Breed library</div>
          <h1>Breeds</h1>
          <p className="muted" style={{ fontSize: 13 }}>
            Curated reference for the app + Scout. Numbers are starting points, not medical advice.
          </p>
        </div>

        <input
          placeholder="Search a breed (e.g. Malinois, Lab, Poodle)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        {results === null ? (
          <span className="muted">Loading…</span>
        ) : results.length === 0 ? (
          <div className="notice">No breeds match “{search}”.</div>
        ) : (
          <div className="stack">
            {results.map((b) => (
              <Link
                key={b.slug}
                to={`/breeds/${b.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div
                      style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}
                    >
                      {b.name}
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {b.kind === 'composite'
                        ? 'Mix'
                        : b.kind === 'unknown'
                          ? 'Unknown'
                          : (b.groupName ?? 'Pure breed')}
                      {' · '}energy {energyLabel(b.energyLevel).toLowerCase()}
                      {b.aka.length > 0 ? ` · aka ${b.aka.slice(0, 2).join(', ')}` : ''}
                    </div>
                  </div>
                  <span className="pill">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
