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

function Boot({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        console.log("🚀 App booting...");
        if (getRefreshToken()) {
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
          console.log("ℹ️ No refresh token found, user needs to login");
        }
      } catch (e) {
        console.error("❌ Boot error:", e);
      } finally {
        setBooting(false);
      }
    })();

    // cross-tab logout sync: if refresh token removed in another tab, clear access token here
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "auth_refresh_token" && ev.newValue === null) {
        console.log("📡 [Storage Event] Refresh token removed in another tab");
        // clear in-memory token
        useAuthStore.getState().clearAccessToken();
        useAuthStore.getState().clearRefreshTimer();
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
