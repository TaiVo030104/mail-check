import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "@/constants/query-keys";
import { useToast } from "@/hooks/use-toast";
import { emailConfigService } from "@/services/email-config";
import type { SaveEmailConfigDto } from "@/types/email-config";

export { QueryKeys };

export function useEmailConfig() {
  return useQuery({
    queryKey: QueryKeys.emailConfig.all,
    queryFn: () => emailConfigService.getEmailConfig(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveEmailConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (config: SaveEmailConfigDto) => emailConfigService.saveEmailConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.emailConfig.all });
      queryClient.invalidateQueries({ queryKey: QueryKeys.emails.mailboxes });
      toast({
        title: "Success",
        description: "Email account connected successfully!",
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to connect email account",
        variant: "destructive",
      });
    },
  });
}

export function useRemoveEmailConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => emailConfigService.removeEmailConfig(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.emailConfig.all });
      queryClient.invalidateQueries({ queryKey: QueryKeys.emails.mailboxes });
      toast({
        title: "Success",
        description: "Email account removed successfully",
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove email account",
        variant: "destructive",
      });
    },
  });
}
