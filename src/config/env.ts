export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const USE_COOKIE_AUTH = import.meta.env.VITE_USE_COOKIE_AUTH === "true";

export const ENABLE_GOOGLE_AUTH = import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== "false";

export const ENABLE_GPT_5_1_CODEX_MAX = import.meta.env.VITE_ENABLE_GPT5_1_CODEX_MAX !== "false";
