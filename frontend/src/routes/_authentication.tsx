import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { ensureAuthForRoute } from "@/hooks/use-require-auth";

export const Route = createFileRoute("/_authentication")({
  beforeLoad: async () => {
    try {
      const ok = await ensureAuthForRoute();
      if (ok === true) return redirect({ to: "/" });
      return true;
    } catch (e) {
      return redirect({ to: "/log-in" });
    }
  },
  component: AuthLayout,
});

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
