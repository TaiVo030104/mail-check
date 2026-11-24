import { create } from "zustand";

import { STORAGE_KEYS, TOKEN_REFRESH_BUFFER_SECONDS } from "@/constants";
import { getSecondsUntilExpiry } from "@/services/jwt";

interface AuthState {
  accessToken: string | null;
  refreshTimer: NodeJS.Timeout | null;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
  scheduleTokenRefresh: (onRefresh: () => Promise<void>) => void;
  clearRefreshTimer: () => void;
  initializeFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshTimer: null,

  setAccessToken: (token: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch {
      // ignore - storage unavailable
    }
    set({ accessToken: token });
  },

  clearAccessToken: () => {
    const state = get();
    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      // ignore - storage unavailable
    }
    set({ accessToken: null, refreshTimer: null });
  },

  scheduleTokenRefresh: (onRefresh: () => Promise<void>) => {
    const state = get();

    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }

    const token = state.accessToken;
    if (!token) {
      return;
    }

    const secondsUntilExpiry = getSecondsUntilExpiry(token);

    if (secondsUntilExpiry <= 0) {
      return;
    }

    const refreshInSeconds = Math.max(0, secondsUntilExpiry - TOKEN_REFRESH_BUFFER_SECONDS);

    const timer = setTimeout(async () => {
      try {
        await onRefresh();
      } catch {
        // ignore - refresh will be retried
      }
    }, refreshInSeconds * 1000);

    set({ refreshTimer: timer });
  },

  clearRefreshTimer: () => {
    const state = get();
    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
      set({ refreshTimer: null });
    }
  },

  initializeFromStorage: () => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (savedToken) {
        set({ accessToken: savedToken });
      }
    } catch {
      // ignore - storage unavailable
    }
  },
}));
