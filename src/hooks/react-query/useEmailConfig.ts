import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailConfigService, SaveEmailConfigDto } from '@/services/emailConfig';
import { useToast } from '@/hooks/use-toast';

export function useEmailConfig() {
  return useQuery({
    queryKey: ['emailConfig'],
    queryFn: () => emailConfigService.getEmailConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSaveEmailConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (config: SaveEmailConfigDto) => emailConfigService.saveEmailConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailConfig'] });
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
      toast({
        title: 'Success',
        description: 'Email account connected successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to connect email account',
        variant: 'destructive',
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
      queryClient.invalidateQueries({ queryKey: ['emailConfig'] });
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
      toast({
        title: 'Success',
        description: 'Email account removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove email account',
        variant: 'destructive',
      });
    },
  });
}
