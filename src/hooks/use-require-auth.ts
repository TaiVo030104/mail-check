import { redirect } from "@tanstack/react-router";

import { useAuthStore } from "@/hooks/use-auth-store";
import { getRefreshToken, refreshAccessToken } from "@/services";

import { hasAnyRole, type UserRole } from "./use-role";

export async function ensureAuthForRoute(requiredRoles?: UserRole[]) {
  try {
    const state = useAuthStore.getState();

    if (!state.accessToken) {
      if (getRefreshToken()) {
        const t = await refreshAccessToken();
        if (!t) {
          return redirect({ to: "/log-in" });
        }
      } else {
        return redirect({ to: "/log-in" });
      }
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const token = useAuthStore.getState().accessToken;
      if (!hasAnyRole(token, requiredRoles)) {
        return redirect({ to: "/" });
      }
    }

    return true;
  } catch (e) {
    return redirect({ to: "/log-in" });
  }
}
