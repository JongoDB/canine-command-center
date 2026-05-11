/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API (empty ⇒ same origin; the dev server proxies /api). */
  readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
