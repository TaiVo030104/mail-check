import { jwtDecode } from "jwt-decode";

import type { JwtPayload } from "@/types/auth";

export type { JwtPayload } from "@/types/auth";

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  return decoded.exp * 1000 < Date.now();
}

export function getSecondsUntilExpiry(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return 0;

  const expiryTime = decoded.exp * 1000;
  const now = Date.now();
  const secondsLeft = Math.floor((expiryTime - now) / 1000);

  return Math.max(0, secondsLeft);
}

export function willExpireSoon(token: string, thresholdSeconds = 60): boolean {
  const secondsLeft = getSecondsUntilExpiry(token);
  return secondsLeft > 0 && secondsLeft <= thresholdSeconds;
}

export function getRoleFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.role || null;
}
