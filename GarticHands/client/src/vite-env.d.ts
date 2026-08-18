/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL the browser uses for API calls.
   * Empty string = same-origin (Docker: nginx proxies /rooms and /socket.io).
   * Unset = falls back to http://localhost:3000 (plain `npm run dev`).
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
