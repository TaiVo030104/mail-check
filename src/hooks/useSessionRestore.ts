import { useEffect, useRef } from "react";
import { useAuthStore } from "./useAuthStore";
import { refreshAccessToken } from "@/services/apiClient";
import { getRefreshToken } from "@/services/token";
import { getSecondsUntilExpiry } from "@/services/jwt";

/**
 * Hook to restore session from localStorage on app startup
 * This prevents session loss on page refresh
 */
export function useSessionRestore() {
  const hasInitialized = useRef(false);
  const store = useAuthStore();

  useEffect(() => {
    // Only run once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const restoreSession = async () => {
      console.log("🔄 Attempting to restore session...");
      
      // First, try to restore access token from localStorage
      store.initializeFromStorage();
      
      const accessToken = useAuthStore.getState().accessToken;
      const refreshToken = getRefreshToken();
      
      // Case 1: We have an access token, check if it's still valid
      if (accessToken) {
        const secondsUntilExpiry = getSecondsUntilExpiry(accessToken);
        
        // Token is still valid for more than 1 minute
        if (secondsUntilExpiry > 60) {
          console.log(`✅ Session restored from localStorage (expires in ${Math.floor(secondsUntilExpiry / 60)}m)`);
          // Schedule refresh before expiry
          store.scheduleTokenRefresh(async () => {
            await refreshAccessToken();
          });
          return;
        }
        
        console.log("⚠️ Access token expired or about to expire, attempting refresh...");
      }
      
      // Case 2: Access token is missing or expired, but we have refresh token
      if (refreshToken) {
        console.log("🔄 Refreshing access token...");
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            console.log("✅ Session restored via token refresh");
            return;
          }
        } catch (error) {
          console.error("❌ Failed to refresh token:", error);
        }
      }
      
      // Case 3: No valid tokens, user needs to log in
      console.log("ℹ️ No valid session found, user needs to log in");
    };

    restoreSession();
  }, [store]);
}
