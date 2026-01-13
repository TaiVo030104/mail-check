import { create } from "zustand";
import { getSecondsUntilExpiry } from "@/services/jwt";

interface AuthState {
  accessToken: string | null;
  refreshTimer: NodeJS.Timeout | null;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
  scheduleTokenRefresh: (onRefresh: () => Promise<void>) => void;
  clearRefreshTimer: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshTimer: null,
  
  setAccessToken: (token: string) => set({ accessToken: token }),
  
  clearAccessToken: () => {
    const state = get();
    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }
    set({ accessToken: null, refreshTimer: null });
  },
  
  scheduleTokenRefresh: (onRefresh: () => Promise<void>) => {
    const state = get();
    
    // Clear existing timer
    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }
    
    const token = state.accessToken;
    if (!token) {
      console.warn('⚠️ Cannot schedule token refresh: no token available');
      return;
    }
    
    const secondsUntilExpiry = getSecondsUntilExpiry(token);
    
    // Token already expired or about to expire
    if (secondsUntilExpiry <= 0) {
      console.warn('⚠️ Token already expired, cannot schedule refresh');
      return;
    }
    
    // Refresh 5 minutes (300s) before expiry for safety, or immediately if less than 5 min left
    // This gives us plenty of time before the 15-minute token expires
    const REFRESH_BUFFER_SECONDS = 300; // 5 minutes
    const refreshInSeconds = Math.max(0, secondsUntilExpiry - REFRESH_BUFFER_SECONDS);
    
    const timer = setTimeout(async () => {
      console.log('🔄 Silent token refresh triggered');
      console.log(`⏰ Token was set to expire in ${secondsUntilExpiry}s`);
      try {
        await onRefresh();
        console.log('✅ Token refreshed successfully');
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
      }
    }, refreshInSeconds * 1000);
    
    set({ refreshTimer: timer });
    const expiryMinutes = Math.floor(secondsUntilExpiry / 60);
    const refreshMinutes = Math.floor(refreshInSeconds / 60);
    console.log(`⏰ Token expires in ${expiryMinutes}m ${secondsUntilExpiry % 60}s`);
    console.log(`⏰ Token refresh scheduled in ${refreshMinutes}m ${refreshInSeconds % 60}s`);
  },
  
  clearRefreshTimer: () => {
    const state = get();
    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
      set({ refreshTimer: null });
    }
  },
}));
