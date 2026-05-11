import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, BRANDING, type Dog, type DogProfileInput } from '@ccc/shared';
import { dogs } from '../lib/dogs';
import { type IntakeFormState, SectionAIdentity } from '../components/intake/IntakeForm';

/** Edit Section A (identity) of an existing dog and PATCH it. */
export function EditDog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<IntakeFormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    dogs
      .get(id)
      .then((d) => {
        if (!live) return;
        setState({ profile: dogToProfile(d), answers: {} });
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

  if (!state || !id) {
    return (
      <div className="screen">
        <div className="center">
          {error ? <span className="error">{error}</span> : <span className="muted">Loading…</span>}
        </div>
      </div>
    );
  }

  async function onSave() {
    if (!state || !id) return;
    setBusy(true);
    setError(null);
    try {
      await dogs.update(id, state.profile);
      navigate(`/dogs/${id}`, { replace: true });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Could not save changes.');
    }
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to={`/dogs/${id}`} className="brand" style={{ textDecoration: 'none' }}>
          {BRANDING.appNameShort}
        </Link>
        <Link to={`/dogs/${id}`} style={{ fontSize: 13 }}>
          Cancel
        </Link>
      </header>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <main className="content stack" style={{ maxWidth: 640 }}>
          <div>
            <div className="eyebrow">Edit · Identity</div>
            <h2 style={{ marginTop: 8 }}>{state.profile.name || 'Edit dog'}</h2>
          </div>
          <div className="card stack">
            <SectionAIdentity state={state} set={setState} />
            {error && <div className="error">{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to={`/dogs/${id}`} style={{ flex: 1 }}>
                <button type="button" className="ghost" style={{ width: '100%' }}>
                  Cancel
                </button>
              </Link>
              <button
                onClick={onSave}
                disabled={busy || state.profile.name.trim() === ''}
                style={{ flex: 2 }}
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Map a Dog (API response) into the form's profile shape. */
function dogToProfile(d: Dog): DogProfileInput {
  return {
    name: d.name,
    breed: d.breed,
    sex: d.sex,
    neuterStatus: d.neuterStatus,
    neuteredOn: d.neuteredOn,
    birthDate: d.birthDate,
    birthDateIsEstimate: d.birthDateIsEstimate,
    weightKg: d.weightKg,
    color: d.color,
    microchip: d.microchip,
    source: d.source,
    acquiredOn: d.acquiredOn,
    acquiredAtAgeWeeks: d.acquiredAtAgeWeeks,
    notes: d.notes,
  };
}
