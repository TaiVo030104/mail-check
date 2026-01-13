/**
 * Environment Configuration
 * 
 * All environment variables with their default values.
 * These defaults will be used if .env file is not present.
 */

/**
 * API Base URL
 * Default: http://localhost:3000
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Use Cookie-based Authentication
 * Default: false (use localStorage for refresh tokens)
 * Set to "true" to use httpOnly cookies
 */
export const USE_COOKIE_AUTH = import.meta.env.VITE_USE_COOKIE_AUTH === "true";

/**
 * Enable Google OAuth Authentication
 * Default: true (enabled)
 * Set to "false" to disable Google sign-in
 */
export const ENABLE_GOOGLE_AUTH = import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== "false";

/**
 * Enable GPT-5.1 Codex Max Features
 * Default: true (enabled)
 * Set to "false" to disable AI features
 */
export const ENABLE_GPT_5_1_CODEX_MAX = import.meta.env.VITE_ENABLE_GPT5_1_CODEX_MAX !== "false";
