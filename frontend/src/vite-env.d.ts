interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_COOKIE_AUTH?: string;
  readonly VITE_ENABLE_GOOGLE_AUTH?: string;
  readonly VITE_ENABLE_GPT5_1_CODEX_MAX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
