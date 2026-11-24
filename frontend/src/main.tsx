import "./styles/globals.css";
import "./styles/prosemirror.css";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import { App } from "@/App";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { STORAGE_KEYS } from "@/constants";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { getRefreshToken, refreshAccessToken } from "@/services";
import { getSecondsUntilExpiry } from "@/services/jwt";

function Boot({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const store = useAuthStore.getState();
        store.initializeFromStorage();

        const accessToken = store.accessToken;
        const refreshToken = getRefreshToken();

        if (accessToken) {
          const secondsUntilExpiry = getSecondsUntilExpiry(accessToken);

          if (secondsUntilExpiry > 60) {
            store.scheduleTokenRefresh(async () => {
              await refreshAccessToken();
            });
            setBooting(false);
            return;
          }
        }

        if (refreshToken) {
          const t = await refreshAccessToken();
          if (!t) {
            toast({
              title: "Session expired",
              description: "Please log in again.",
              variant: "destructive",
            });
          }
        }
      } catch {
        // ignore - boot error handled by auth flow
      } finally {
        setBooting(false);
      }
    })();

    const onStorage = (ev: StorageEvent) => {
      const store = useAuthStore.getState();

      if (ev.key === STORAGE_KEYS.REFRESH_TOKEN && ev.newValue === null) {
        store.clearAccessToken();
        store.clearRefreshTimer();
      }

      if (ev.key === STORAGE_KEYS.ACCESS_TOKEN && ev.newValue === null) {
        store.clearAccessToken();
        store.clearRefreshTimer();
      }

      if (ev.key === STORAGE_KEYS.ACCESS_TOKEN && ev.newValue) {
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
      <div className="flex min-h-screen items-center justify-center">
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
