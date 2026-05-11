import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, BRANDING, type Dog, type IntakeResponse, breedLabel } from '@ccc/shared';
import { conversations } from '../lib/conversations';
import { dogs } from '../lib/dogs';
import { nameToSlug } from '../lib/breeds';
import { signOut, useSession } from '../lib/auth-client';

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function Row({ label, value }: { label: string; value: unknown }) {
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
        {pretty(value)}
      </div>
    </div>
  );
}

export function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = useSession();
  const [dog, setDog] = useState<Dog | null>(null);
  const [intake, setIntake] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setError(null);
    Promise.all([
      dogs.get(id),
      dogs
        .getIntake(id)
        .catch((e: unknown) =>
          e instanceof ApiError && e.status === 404 ? null : Promise.reject(e),
        ),
    ])
      .then(([d, i]) => {
        if (!live) return;
        setDog(d);
        setIntake(i);
      })
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) navigate('/', { replace: true });
        else setError(e instanceof Error ? e.message : 'Could not load this dog.');
      });
    return () => {
      live = false;
    };
  }, [id, navigate]);

  if (!dog) {
    return (
      <div className="screen">
        <div className="center">
          {error ? <span className="error">{error}</span> : <span className="muted">Loading…</span>}
        </div>
      </div>
    );
  }

  async function onArchive() {
    if (!dog) return;
    if (!confirm(`Archive ${dog.name}? You can re-create them later but their record is removed.`))
      return;
    setArchiving(true);
    try {
      await dogs.archive(dog.id);
      navigate('/', { replace: true });
    } catch (e) {
      setArchiving(false);
      setError(e instanceof Error ? e.message : 'Could not archive this dog.');
    }
  }

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
          <div className="eyebrow">Profile</div>
          <h1>{dog.name}</h1>
          <p className="muted">
            {breedLabel(dog.breed)} {dog.sex !== 'unknown' ? `· ${dog.sex}` : ''}
            {dog.ageMonths !== null
              ? ` · ${Math.floor(dog.ageMonths / 12)}y ${dog.ageMonths % 12}mo`
              : ''}
          </p>
          {dog.breed.kind === 'mix' && dog.breed.primary && dog.breed.secondary ? (
            <p style={{ fontSize: 13, marginTop: 4 }}>
              <Link to={`/breeds/${nameToSlug(`${dog.breed.primary} x ${dog.breed.secondary}`)}`}>
                View breed profile →
              </Link>
            </p>
          ) : dog.breed.primary ? (
            <p style={{ fontSize: 13, marginTop: 4 }}>
              <Link to={`/breeds/${nameToSlug(dog.breed.primary)}`}>View breed profile →</Link>
            </p>
          ) : null}
        </div>

        <div className="card stack">
          <Row label="Sex" value={dog.sex} />
          <Row label="Neuter status" value={dog.neuterStatus} />
          <Row
            label="Birth date"
            value={
              dog.birthDate ? `${dog.birthDate}${dog.birthDateIsEstimate ? ' (est.)' : ''}` : null
            }
          />
          <Row label="Weight (kg)" value={dog.weightKg} />
          <Row label="Color" value={dog.color} />
          <Row label="Microchip" value={dog.microchip} />
          <Row label="Source" value={dog.source} />
          <Row label="Got them on" value={dog.acquiredOn} />
          <Row label="Age (weeks) when got" value={dog.acquiredAtAgeWeeks} />
          <Row label="Notes" value={dog.notes} />
        </div>

        <div className="card stack">
          <h2 style={{ fontSize: 18 }}>Intake</h2>
          {intake ? (
            <>
              <p className="muted" style={{ fontSize: 13 }}>
                Submitted v{intake.version} on {new Date(intake.createdAt).toLocaleDateString()}.
              </p>
              <Row label="Living" value={intake.answers.living} />
              <Row label="Goals" value={intake.answers.goals} />
              <Row label="History" value={intake.answers.history} />
              <Row label="Current state" value={intake.answers.current} />
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              No intake submitted yet for this dog.
            </p>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <button
          onClick={async () => {
            if (!dog) return;
            try {
              const c = await conversations.create({ dogId: dog.id });
              navigate(`/scout/${c.id}`);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not start a chat.');
            }
          }}
          style={{ width: '100%' }}
        >
          Talk to {BRANDING.assistantName} about {dog.name}
        </button>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to={`/dogs/${dog.id}/edit`} style={{ flex: 1 }}>
            <button className="ghost" style={{ width: '100%' }}>
              Edit profile
            </button>
          </Link>
          <button onClick={onArchive} disabled={archiving} style={{ flex: 1 }}>
            {archiving ? 'Archiving…' : 'Archive'}
          </button>
        </div>
      </main>
    </div>
  );
}
