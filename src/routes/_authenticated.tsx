import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { ErrorFallback } from "@/components/error-fallback";
import { ensureAuthForRoute } from "@/hooks/use-require-auth";

function AuthenticatedPage() {
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    try {
      const ok = await ensureAuthForRoute();
      if (ok !== true) return ok;
      if (location.pathname === "/log-in" || location.pathname === "/sign-up") {
        return redirect({ to: "/inbox" });
      }

      if (location.pathname === "/") {
        return redirect({ to: "/inbox" });
      }
      return true;
    } catch (e) {
      return redirect({ to: "/log-in" });
    }
  },
  pendingComponent: () => {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  },
  errorComponent: () => {
    return <ErrorFallback />;
  },
  component: AuthenticatedPage,
});
