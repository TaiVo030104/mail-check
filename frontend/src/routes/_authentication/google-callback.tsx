import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { refreshAccessToken } from "@/services/api-client";
import { authSync } from "@/services/auth-sync";
import { setRefreshToken } from "@/services/token";

export const Route = createFileRoute("/_authentication/google-callback")({
  beforeLoad: () => {
    return;
  },
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");
        const email = params.get("email");
        const username = params.get("username");

        if (!accessToken || !refreshToken) {
          throw new Error("Missing authentication data");
        }

        const store = useAuthStore.getState();

        setRefreshToken(refreshToken);

        store.setAccessToken(accessToken);

        store.scheduleTokenRefresh(async () => {
          await refreshAccessToken();
        });

        authSync.broadcastLogin(accessToken);

        toast({
          title: "Success",
          description: `Successfully signed in with Google! Welcome ${username || email}`,
        });

        navigate({ to: "/" });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
        navigate({ to: "/log-in" });
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto size-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Completing Google Sign-In...</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  );
}
