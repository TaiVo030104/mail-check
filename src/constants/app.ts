export const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
  THEME: "theme",
  AUTH_SYNC_EVENT: "auth-sync-event",
} as const;

export const AUTH_SYNC_CHANNEL = "auth-sync-channel";

export const TOKEN_REFRESH_BUFFER_SECONDS = 300;

export const AUTO_SAVE_INTERVAL_MS = 30_000;

export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

export const HEALTH_POLL_INTERVAL_MS = 60_000;

export const CACHE_TTL_MS = 30 * 60 * 1000;

export const EMAIL_STALE_TIME_MS = 5 * 60 * 1000;

export const DEFAULT_PAGE_SIZE = 25;

export const VIRTUALIZER_ESTIMATED_ROW_HEIGHT = 88;
