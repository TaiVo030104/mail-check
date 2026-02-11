import { getRoleFromToken } from "@/services/jwt";

import { useAuthStore } from "./use-auth-store";

export type UserRole = string;

export function useUserRole(): string | null {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) return null;

  return getRoleFromToken(accessToken);
}

export function useHasRole(requiredRole: UserRole): boolean {
  const currentRole = useUserRole();

  if (!currentRole) return false;

  return currentRole === requiredRole;
}

export function useHasAnyRole(roles: UserRole[]): boolean {
  const currentRole = useUserRole();

  if (!currentRole) return false;

  return roles.includes(currentRole);
}

export function hasRole(token: string | null, requiredRole: UserRole): boolean {
  if (!token) return false;

  const role = getRoleFromToken(token);
  return role === requiredRole;
}

export function hasAnyRole(token: string | null, roles: UserRole[]): boolean {
  if (!token) return false;

  const role = getRoleFromToken(token);
  return role !== null && roles.includes(role);
}
