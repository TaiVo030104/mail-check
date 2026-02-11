export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  updateAvailable: boolean;
}

export type AuthSyncMessage =
  | { type: "LOGOUT" }
  | { type: "LOGIN"; accessToken: string }
  | { type: "TOKEN_REFRESH"; accessToken: string };
