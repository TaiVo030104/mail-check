import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { QueryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { getUser, signIn, signOut, signUp } from "@/services/auth";

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setAccessToken } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signIn,
    onSuccess: (data) => {
      if (data?.accessToken) setAccessToken(data.accessToken);
      queryClient.invalidateQueries({ queryKey: QueryKeys.auth.profile() });
      navigate({ to: "/inbox" });
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      navigate({ to: "/log-in" });
      toast({
        title: "Success",
        description: "You have successfully signed up",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSignOut() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearAccessToken } = useAuthStore();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      navigate({ to: "/log-in" });
      clearAccessToken();
      queryClient.clear();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUserProfile() {
  const token = useAuthStore.getState().accessToken;
  return useQuery({
    queryFn: getUser,
    queryKey: QueryKeys.auth.profile(),
    enabled: Boolean(token),
    retry: false,
  });
}
