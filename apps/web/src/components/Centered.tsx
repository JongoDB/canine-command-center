import type { ReactNode } from 'react';
import { BRANDING } from '@ccc/shared';

/** Full-screen centered card — the auth screens' shell. */
export function Centered({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="screen">
      <div className="center">
        <div className="card stack">
          <div>
            <div className="eyebrow">{BRANDING.appName}</div>
            <h2 style={{ marginTop: 8 }}>{title}</h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Brief full-screen message (loading, etc.). */
export function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="screen">
      <div className="center">
        <span className="muted">{children}</span>
      </div>
    </div>
  );
}
