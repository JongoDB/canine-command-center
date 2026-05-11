import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, BRANDING } from '@ccc/shared';
import { dogs } from '../lib/dogs';
import { EMPTY_DEFAULT, IntakeStepper, MAL_DUTCH_DEFAULT } from '../components/intake/IntakeForm';

/**
 * The 5-section intake stepper for a new dog. Pre-fills the Belgian Malinois ×
 * Dutch Shepherd × female × high-drive default (PRODUCT.md §5) — the user can
 * tap "Start fresh" for a blank form.
 */
export function Onboard() {
  const navigate = useNavigate();
  const [useDefault, setUseDefault] = useState(true);

  return (
    <div className="screen">
      <header className="appbar">
        <span className="brand">{BRANDING.appNameShort}</span>
        <Link to="/" style={{ fontSize: 13 }}>
          Back home
        </Link>
      </header>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <main
          className="content stack"
          style={{ maxWidth: 640, paddingTop: 28, paddingBottom: 56 }}
        >
          <div>
            <div className="eyebrow">Intake</div>
            <h2 style={{ marginTop: 8 }}>Tell us about your dog</h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              Five short sections. Skip anything you don’t know — you can always come back to it.
              {useDefault ? (
                <>
                  {' '}
                  <button
                    className="ghost"
                    type="button"
                    style={{
                      width: 'auto',
                      padding: '2px 10px',
                      display: 'inline-block',
                      marginLeft: 4,
                    }}
                    onClick={() => setUseDefault(false)}
                  >
                    Start fresh
                  </button>
                </>
              ) : (
                <>
                  {' '}
                  <button
                    className="ghost"
                    type="button"
                    style={{
                      width: 'auto',
                      padding: '2px 10px',
                      display: 'inline-block',
                      marginLeft: 4,
                    }}
                    onClick={() => setUseDefault(true)}
                  >
                    Use the example
                  </button>
                </>
              )}
            </p>
          </div>
          <div className="card stack" style={{ maxWidth: 'none' }}>
            <IntakeStepper
              key={useDefault ? 'default' : 'empty'}
              initial={useDefault ? MAL_DUTCH_DEFAULT : EMPTY_DEFAULT}
              onSubmit={async ({ profile, answers }) => {
                try {
                  const dog = await dogs.create(profile);
                  await dogs.submitIntake(dog.id, { answers });
                  navigate(`/dogs/${dog.id}`, { replace: true });
                } catch (e) {
                  if (e instanceof ApiError) throw new Error(`${e.code}: ${e.message}`);
                  throw e;
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
