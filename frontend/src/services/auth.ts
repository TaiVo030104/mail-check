import { USE_COOKIE_AUTH } from "@/config/env";
import { useAuthStore } from "@/hooks/use-auth-store";
import api, { apiAuth, refreshAccessToken } from "@/services/api-client";
import type { AuthInfo, AuthUser, SignInParams, SignUpParams } from "@/types/auth";

import { authSync } from "./auth-sync";
import { getErrorMessage } from "./error";
import { clearAllTokens, setRefreshToken } from "./token";

export type { AuthInfo, AuthUser, SignInParams, SignUpParams } from "@/types/auth";

const USE_COOKIES = USE_COOKIE_AUTH;

export const signIn = async (params: SignInParams) => {
  try {
    const resp = await apiAuth.post("/login", params);
    const data = resp.data as AuthInfo;

    if (data.refreshToken && !USE_COOKIES) {
      setRefreshToken(data.refreshToken);
    }

    if (data.accessToken) {
      const store = useAuthStore.getState();
      store.setAccessToken(data.accessToken);

      store.scheduleTokenRefresh(async () => {
        await refreshAccessToken();
      });

      authSync.broadcastLogin(data.accessToken);
    }
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Unable to sign in. Please try again."));
  }
};

export const signUp = async (params: SignUpParams) => {
  try {
    const resp = await apiAuth.post("/register", params);
    return resp.data as AuthInfo;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Unable to sign up. Please try again."));
  }
};

export const signOut = async () => {
  try {
    await apiAuth.post("/logout");
  } catch {
    // ignore - logout endpoint failure is non-critical
  }
  clearAllTokens();
  const store = useAuthStore.getState();
  store.clearAccessToken();
  store.clearRefreshTimer();

  authSync.broadcastLogout();
  return Promise.resolve();
};

export const getUser = async () => {
  try {
    const resp = await api.get("/profile");
    return resp.data as AuthUser;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Unable to fetch profile."));
  }
};
