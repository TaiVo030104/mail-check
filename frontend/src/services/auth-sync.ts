import { AUTH_SYNC_CHANNEL, STORAGE_KEYS } from "@/constants";
import { useAuthStore } from "@/hooks/use-auth-store";
import type { AuthSyncMessage } from "@/types/infrastructure";

import { clearAllTokens } from "./token";

const CHANNEL_NAME = AUTH_SYNC_CHANNEL;

class AuthSyncService {
  private channel: BroadcastChannel | null = null;
  private useStorageEvents = false;
  private storageKey = STORAGE_KEYS.AUTH_SYNC_EVENT;

  constructor() {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } else {
      this.useStorageEvents = true;
      window.addEventListener("storage", this.handleStorageEvent);
    }
  }

  private handleMessage = (message: AuthSyncMessage) => {
    const store = useAuthStore.getState();

    switch (message.type) {
      case "LOGOUT":
        store.clearAccessToken();
        store.clearRefreshTimer();
        clearAllTokens();

        if (window.location.pathname !== "/log-in" && window.location.pathname !== "/sign-up") {
          window.location.href = "/log-in";
        }
        break;

      case "LOGIN":
        store.setAccessToken(message.accessToken);

        store.scheduleTokenRefresh(async () => {
          const { refreshAccessToken } = await import("./api-client");
          await refreshAccessToken();
        });

        if (window.location.pathname === "/log-in" || window.location.pathname === "/sign-up") {
          window.location.href = "/";
        }
        break;

      case "TOKEN_REFRESH":
        store.setAccessToken(message.accessToken);

        store.scheduleTokenRefresh(async () => {
          const { refreshAccessToken } = await import("./api-client");
          await refreshAccessToken();
        });
        break;
    }
  };

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === this.storageKey && event.newValue) {
      try {
        const message = JSON.parse(event.newValue) as AuthSyncMessage;
        this.handleMessage(message);
        localStorage.removeItem(this.storageKey);
      } catch {
        // ignore - malformed storage event
      }
    }
  };

  public broadcastLogout() {
    const message: AuthSyncMessage = { type: "LOGOUT" };

    if (this.channel) {
      this.channel.postMessage(message);
    } else if (this.useStorageEvents) {
      localStorage.setItem(this.storageKey, JSON.stringify(message));
      localStorage.removeItem(this.storageKey);
    }
  }

  public broadcastLogin(accessToken: string) {
    const message: AuthSyncMessage = { type: "LOGIN", accessToken };

    if (this.channel) {
      this.channel.postMessage(message);
    } else if (this.useStorageEvents) {
      localStorage.setItem(this.storageKey, JSON.stringify(message));
      localStorage.removeItem(this.storageKey);
    }
  }

  public broadcastTokenRefresh(accessToken: string) {
    const message: AuthSyncMessage = { type: "TOKEN_REFRESH", accessToken };

    if (this.channel) {
      this.channel.postMessage(message);
    } else if (this.useStorageEvents) {
      localStorage.setItem(this.storageKey, JSON.stringify(message));
      localStorage.removeItem(this.storageKey);
    }
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
    } else if (this.useStorageEvents) {
      window.removeEventListener("storage", this.handleStorageEvent);
    }
  }
}

export const authSync = new AuthSyncService();
