import "./styles/globals.css";
import "./styles/prosemirror.css";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import { getRefreshToken, refreshAccessToken } from "./services";
import { useToast } from "./hooks/use-toast";
import { useAuthStore } from "./hooks/useAuthStore";
import { ThemeProvider } from "./components/theme-provider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getSecondsUntilExpiry } from "./services/jwt";

function Boot({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        console.log("🚀 App booting...");
        
        // Step 1: Try to restore access token from localStorage
        const store = useAuthStore.getState();
        store.initializeFromStorage();
        
        const accessToken = store.accessToken;
        const refreshToken = getRefreshToken();
        
        // Step 2: Check if access token is still valid
        if (accessToken) {
          const secondsUntilExpiry = getSecondsUntilExpiry(accessToken);
          
          // Token is still valid for more than 1 minute
          if (secondsUntilExpiry > 60) {
            console.log(`✅ Session restored from localStorage (expires in ${Math.floor(secondsUntilExpiry / 60)}m)`);
            // Schedule refresh before expiry
            store.scheduleTokenRefresh(async () => {
              await refreshAccessToken();
            });
            setBooting(false);
            return;
          }
          
          console.log("⚠️ Access token expired or about to expire, attempting refresh...");
        }
        
        // Step 3: If access token is missing or expired, try to refresh
        if (refreshToken) {
          console.log("🔑 Refresh token found, attempting to get access token...");
          const t = await refreshAccessToken();
          if (!t) {
            console.warn("⚠️ Failed to refresh token on boot");
            toast({
              title: "Session expired",
              description: "Please log in again.",
              variant: "destructive",
            });
          } else {
            console.log("✅ Access token obtained successfully");
          }
        } else {
          console.log("ℹ️ No valid tokens found, user needs to login");
        }
      } catch (e) {
        console.error("❌ Boot error:", e);
      } finally {
        setBooting(false);
      }
    })();

    // cross-tab logout sync: if tokens removed in another tab, clear here too
    const onStorage = (ev: StorageEvent) => {
      const store = useAuthStore.getState();
      
      // Refresh token removed in another tab
      if (ev.key === "auth_refresh_token" && ev.newValue === null) {
        console.log("📡 [Storage Event] Refresh token removed in another tab");
        store.clearAccessToken();
        store.clearRefreshTimer();
      }
      
      // Access token removed in another tab
      if (ev.key === "auth_access_token" && ev.newValue === null) {
        console.log("📡 [Storage Event] Access token removed in another tab");
        store.clearAccessToken();
        store.clearRefreshTimer();
      }
      
      // Access token updated in another tab (e.g., login in another tab)
      if (ev.key === "auth_access_token" && ev.newValue) {
        console.log("📡 [Storage Event] Access token updated in another tab");
        store.initializeFromStorage();
        store.scheduleTokenRefresh(async () => {
          await refreshAccessToken();
        });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [toast]);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Starting...</div>
      </div>
    );
  }

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <Boot>
          <App />
        </Boot>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
