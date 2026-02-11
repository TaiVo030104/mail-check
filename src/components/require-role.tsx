import type { ReactNode } from "react";

import { useHasAnyRole, useHasRole, type UserRole } from "@/hooks/use-role";

interface RequireRoleProps {
  role: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const hasRole = useHasRole(role);

  return hasRole ? <>{children}</> : <>{fallback}</>;
}

interface RequireAnyRoleProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAnyRole({ roles, children, fallback = null }: RequireAnyRoleProps) {
  const hasAnyRole = useHasAnyRole(roles);

  return hasAnyRole ? <>{children}</> : <>{fallback}</>;
}
