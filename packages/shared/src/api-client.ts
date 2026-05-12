import type { ApiErrorResponse, HealthStatus, ReadyStatus, User } from './types';

/** Error thrown by `ApiClient` for any non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  constructor(message: string, opts: { status: number; code: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

export interface ApiClientOptions {
  /** Base URL of the API, e.g. `http://localhost:4000` (no trailing slash). */
  baseUrl: string;
  /** Send credentials (cookies) — true for the web client; false for mobile. Default true. */
  credentials?: boolean;
  /** Extra headers per request (e.g. `Authorization` for the mobile bearer token). */
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Inject a `fetch` implementation (tests, custom environments). Defaults to the global. */
  fetch?: typeof fetch;
  /** Called on every `ApiError` (e.g. to clear the session on 401). */
  onError?: (error: ApiError) => void;
}

function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Thin typed fetch wrapper around the Canine Command Center API. Auth itself
 * goes through Better Auth's own client; this is for everything else
 * (`/health`, `/me`, and — from M1.x — `/dogs`, `/program`, `/chat`, …).
 */
export class ApiClient {
  constructor(private readonly opts: ApiClientOptions) {}

  private get fetchImpl(): typeof fetch {
    const f = this.opts.fetch ?? globalThis.fetch;
    if (!f) throw new Error('ApiClient: no fetch available — pass one via options.fetch');
    // Native `fetch` must be invoked with `this` === the global; held on an
    // instance and called as `this.fetchImpl(...)`, the `this` becomes the
    // ApiClient and browsers throw "Illegal invocation". Bind it. (Binding an
    // injected test fetch to `globalThis` is harmless for typical impls.)
    return f.bind(globalThis);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    if (init.body !== undefined && init.body !== null && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (this.opts.headers) {
      for (const [k, v] of Object.entries(await this.opts.headers())) headers.set(k, v);
    }

    const res = await this.fetchImpl(`${this.opts.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: (this.opts.credentials ?? true) ? 'include' : 'same-origin',
    });

    const data = parseJson(await res.text());
    if (!res.ok) {
      const body = data as ApiErrorResponse | undefined;
      const err = new ApiError(body?.error?.message ?? res.statusText ?? 'Request failed', {
        status: res.status,
        code: body?.error?.code ?? `HTTP_${res.status}`,
        details: body?.error?.details,
      });
      this.opts.onError?.(err);
      throw err;
    }
    return data as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  // --- convenience endpoints ---
  health(): Promise<HealthStatus> {
    return this.get<HealthStatus>('/health');
  }
  ready(): Promise<ReadyStatus> {
    return this.get<ReadyStatus>('/health/ready');
  }
  me(): Promise<User> {
    return this.get<User>('/me');
  }
}
