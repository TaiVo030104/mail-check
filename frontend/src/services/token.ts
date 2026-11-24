import { STORAGE_KEYS } from "@/constants";

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
};

export const setRefreshToken = (token: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch {
    // ignore - storage unavailable
  }
};

export const clearRefreshToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    // ignore - storage unavailable
  }
};

export const clearAllTokens = () => {
  clearRefreshToken();
};
