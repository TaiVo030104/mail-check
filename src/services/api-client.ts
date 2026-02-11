import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL, USE_COOKIE_AUTH } from "@/config/env";
import { useAuthStore } from "@/hooks/use-auth-store";
import { toast } from "@/hooks/use-toast";
import { clearAllTokens, getRefreshToken, setRefreshToken } from "@/services/token";

import { authSync } from "./auth-sync";

const BASE_URL = API_BASE_URL;
const USE_COOKIES = USE_COOKIE_AUTH;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: USE_COOKIES,
});

const apiAuth: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: USE_COOKIES,
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!USE_COOKIES && !refreshToken) {
    return null;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const payload = USE_COOKIES ? {} : { refreshToken };

      const resp = await apiAuth.post("/refresh", payload);
      const data = resp.data as { accessToken: string; refreshToken?: string };
      const accessToken = data.accessToken;

      if (data.refreshToken && !USE_COOKIES) {
        setRefreshToken(data.refreshToken);
      }

      const store = useAuthStore.getState();
      store.setAccessToken(accessToken);

      store.scheduleTokenRefresh(async () => {
        await refreshAccessToken();
      });

      authSync.broadcastTokenRefresh(accessToken);

      return accessToken;
    } catch (e) {
      clearAllTokens();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        if (!originalRequest.headers) originalRequest.headers = {};
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      clearAllTokens();
      const store = useAuthStore.getState();
      store.clearAccessToken();
      store.clearRefreshTimer();
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      });

      window.location.href = "/log-in";
    }

    if (!error.response) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
    return Promise.reject(error);
  }
);

export { apiAuth };
export { refreshAccessToken };
export default api;
