/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_BASE_URL?: string;
  readonly VITE_EMAIL_API_URL?: string;
  readonly VITE_EMAIL_API_KEY?: string;
  readonly VITE_EMAIL_BRAND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// The API host (set in vite.config.ts; '' = same origin through the dev proxy).
declare const __ZQ_API_HOST__: string;
