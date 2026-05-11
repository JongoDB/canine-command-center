// Shared API contract types — what the clients can rely on from the API.
// Grows per milestone (dog, breed, program, conversation, … from M1.x).

/** Standard error response body the API returns on 4xx/5xx. */
export interface ApiErrorResponse {
  error: { code: string; message: string; details?: unknown };
}

/** The authenticated user, as returned by `GET /me`. */
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  /** ISO-8601 timestamp. */
  createdAt: string;
}

/** `GET /health` (liveness). */
export interface HealthStatus {
  status: 'ok';
  service: string;
  db: 'ok' | 'down';
  uptimeSeconds: number;
  /** ISO-8601 timestamp. */
  time: string;
}

/** `GET /health/ready` (readiness). */
export interface ReadyStatus {
  status: 'ready' | 'not-ready';
  db: 'ok' | 'down';
}
