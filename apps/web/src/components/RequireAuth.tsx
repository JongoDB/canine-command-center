import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../lib/auth-client';
import { FullScreen } from './Centered';

/** Gate for authenticated routes — bounces to /sign-in when there's no session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();
  const location = useLocation();

  if (isPending) return <FullScreen>Loading…</FullScreen>;
  if (!data?.user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
