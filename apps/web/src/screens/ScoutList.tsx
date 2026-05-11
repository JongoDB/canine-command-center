import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, BRANDING, type Conversation } from '@ccc/shared';
import { conversations } from '../lib/conversations';
import { signOut, useSession } from '../lib/auth-client';

export function ScoutList() {
  const navigate = useNavigate();
  const { data } = useSession();
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    conversations
      .list()
      .then((c) => live && setConvos(c))
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 401) navigate('/sign-in', { replace: true });
        else setError(e instanceof Error ? e.message : 'Could not load conversations.');
      });
    return () => {
      live = false;
    };
  }, [navigate]);

  async function onNew() {
    setBusy(true);
    setError(null);
    try {
      const c = await conversations.create({});
      navigate(`/scout/${c.id}`);
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Could not start a chat.');
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
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div className="eyebrow">{BRANDING.assistantName}</div>
            <h1>Chats</h1>
            <p className="muted" style={{ fontSize: 13 }}>
              Talk to {BRANDING.assistantName}, your in-app dog-raising expert. Anchor a chat to a
              dog (from their profile) or start a free-form one.
            </p>
          </div>
          <button onClick={onNew} disabled={busy} style={{ width: 'auto', padding: '8px 16px' }}>
            {busy ? 'Starting…' : '+ New chat'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {convos === null ? (
          <span className="muted">Loading…</span>
        ) : convos.length === 0 ? (
          <div className="notice">
            No chats yet. Tap “+ New chat” to start one, or open a dog and choose “Talk to{' '}
            {BRANDING.assistantName}”.
          </div>
        ) : (
          <div className="stack">
            {convos.map((c) => (
              <Link
                key={c.id}
                to={`/scout/${c.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card">
                  <div
                    style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}
                  >
                    {c.title || 'New chat'}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Updated {new Date(c.updatedAt).toLocaleString()}
                    {c.dogId ? ' · anchored to a dog' : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
