import { type ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, BRANDING, type BreedProfile, energyLabel, trainabilityLabel } from '@ccc/shared';
import { breeds } from '../lib/breeds';

function rangeLabel(r: BreedProfile['weightKgRange'], unit: string): string | null {
  if (!r) return null;
  return `${r.min}–${r.max} ${unit}`;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '8px 0',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          minWidth: 180,
          color: 'var(--text-muted)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, color: 'var(--cream)', fontSize: 14, whiteSpace: 'pre-wrap' }}>
        {value}
      </div>
    </div>
  );
}

export function BreedDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [breed, setBreed] = useState<BreedProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let live = true;
    setNotFound(false);
    setError(null);
    breeds
      .get(slug)
      .then((b) => live && setBreed(b))
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else if (e instanceof ApiError && e.status === 401) navigate('/sign-in', { replace: true });
        else setError(e instanceof Error ? e.message : 'Could not load this breed.');
      });
    return () => {
      live = false;
    };
  }, [slug, navigate]);

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/breeds" className="brand" style={{ textDecoration: 'none' }}>
          {BRANDING.appNameShort}
        </Link>
        <Link to="/breeds" style={{ fontSize: 13 }}>
          ← All breeds
        </Link>
      </header>
      <main className="content stack" style={{ maxWidth: 720 }}>
        {error && <div className="error">{error}</div>}
        {notFound ? (
          <div className="notice">
            No profile in our library yet for <code>{slug}</code>. The app still works for any breed
            — Scout learns about your dog from intake.
          </div>
        ) : !breed ? (
          <span className="muted">Loading…</span>
        ) : (
          <>
            <div>
              <div className="eyebrow">
                {breed.kind === 'composite'
                  ? 'Composite mix'
                  : breed.kind === 'unknown'
                    ? 'Unknown mix'
                    : (breed.groupName ?? 'Pure breed')}
              </div>
              <h1>{breed.name}</h1>
              {breed.aka.length > 0 && (
                <p className="muted" style={{ fontSize: 13 }}>
                  Also known as: {breed.aka.join(', ')}
                </p>
              )}
            </div>

            {breed.bredFor && (
              <div className="notice">
                <strong
                  style={{
                    color: 'var(--tan-light)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Bred for
                </strong>
                {breed.bredFor}
              </div>
            )}

            <div className="card stack">
              <Row label="Energy" value={energyLabel(breed.energyLevel)} />
              <Row label="Trainability" value={trainabilityLabel(breed.trainability)} />
              <Row label="Weight (kg)" value={rangeLabel(breed.weightKgRange, 'kg') ?? '—'} />
              <Row label="Height (cm)" value={rangeLabel(breed.heightCmRange, 'cm') ?? '—'} />
              <Row
                label="Lifespan (yrs)"
                value={rangeLabel(breed.lifespanYearsRange, 'yrs') ?? '—'}
              />
              {breed.temperament.length > 0 && (
                <Row label="Temperament" value={breed.temperament.join(' · ')} />
              )}
              {breed.parentSlugs.length > 0 && (
                <Row
                  label="Parent breeds"
                  value={
                    <>
                      {breed.parentSlugs.map((p, i) => (
                        <span key={p}>
                          {i > 0 ? ' · ' : ''}
                          <Link to={`/breeds/${p}`}>{p}</Link>
                        </span>
                      ))}
                    </>
                  }
                />
              )}
            </div>

            {breed.dailyExerciseTarget && (
              <div className="card stack">
                <h2 style={{ fontSize: 18 }}>Daily exercise reality</h2>
                <p style={{ fontSize: 14 }}>{breed.dailyExerciseTarget}</p>
              </div>
            )}

            {breed.healthPredispositions.length > 0 && (
              <div className="card stack">
                <h2 style={{ fontSize: 18 }}>Health watch‑list</h2>
                <p className="muted" style={{ fontSize: 12 }}>
                  Things to ask your vet about — not a diagnosis.
                </p>
                <ul style={{ paddingLeft: 18, fontSize: 14 }}>
                  {breed.healthPredispositions.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {breed.groomingNotes && (
              <div className="card stack">
                <h2 style={{ fontSize: 18 }}>Grooming</h2>
                <p style={{ fontSize: 14 }}>{breed.groomingNotes}</p>
              </div>
            )}

            {breed.notes && (
              <div className="card stack">
                <h2 style={{ fontSize: 18 }}>Notes</h2>
                <p style={{ fontSize: 14 }}>{breed.notes}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
