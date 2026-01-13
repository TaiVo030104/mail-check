import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailService, SendEmailDto, ReplyEmailDto, EmailFilters } from '@/services/email';
import { useToast } from '@/hooks/use-toast';

export function useMailboxes() {
  return useQuery({
    queryKey: ['mailboxes'],
    queryFn: () => emailService.getMailboxes(),
    staleTime: 1000 * 60 * 2, // 2 minutes - mailbox counts don't change that often
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 minutes in background
  });
}

export function useEmailsByFolder(
  folder: string, 
  page: number = 1, 
  limit: number = 50,
  filters?: EmailFilters
) {
  return useQuery({
    queryKey: ['emails', folder, page, limit, filters],
    queryFn: () => emailService.getEmailsByFolder(folder, page, limit, filters),
    enabled: !!folder,
    staleTime: 1000 * 30, // 30 seconds - balance freshness vs performance
    gcTime: 1000 * 60 * 5, // Keep cached for 5 minutes
    refetchOnWindowFocus: true,
    // Remove refetchOnMount to use cache when navigating back
  });
}

export function useEmailDetail(id: string) {
  return useQuery({
    queryKey: ['email', id],
    queryFn: () => emailService.getEmailById(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute - email content rarely changes
    gcTime: 1000 * 60 * 10, // Keep in cache longer for quick navigation
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: SendEmailDto) => emailService.sendEmail(data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails', 'sent'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Success',
        description: 'Email sent successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send email',
        variant: 'destructive',
      });
    },
  });
}

export function useReplyEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReplyEmailDto }) => {
      return emailService.replyEmail(id, data);
    },
    onSuccess: async (_response: any, variables: any) => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails', 'sent'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['email', variables.id],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Success',
        description: 'Reply sent successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send reply',
        variant: 'destructive',
      });
    },
  });
}

export function useToggleStar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => emailService.toggleStar(id),
    onSuccess: async (data) => {
      // Only invalidate affected folders
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails', 'starred'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails', 'inbox'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['email'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: data.isStarred ? 'Starred' : 'Unstarred',
        description: data.isStarred
          ? 'Email added to starred'
          : 'Email removed from starred',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update email',
        variant: 'destructive',
      });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      emailService.markAsRead(id, isRead),
    onSuccess: async (_data, variables) => {
      // Invalidate mailboxes to update unread counts
      await queryClient.invalidateQueries({ 
        queryKey: ['mailboxes'],
        refetchType: 'active' // Only refetch if component is mounted
      });
      
      // Invalidate email lists - this will use cache if within staleTime
      await queryClient.invalidateQueries({ 
        queryKey: ['emails'],
        refetchType: 'active'
      });
      
      // Invalidate specific email detail
      if (variables?.id) {
        await queryClient.invalidateQueries({ 
          queryKey: ['email', variables.id],
          refetchType: 'active'
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to mark email as read:', error);
    },
  });
}

export function useDeleteEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => emailService.deleteEmail(id),
    onSuccess: async (data) => {
      // Delete affects multiple folders
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete email',
        variant: 'destructive',
      });
    },
  });
}

export function useSeedMockEmails() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => emailService.seedMockEmails(),
    onSuccess: async (data) => {
      // Clear all email cache after seeding
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to seed emails',
        variant: 'destructive',
      });
    },
  });
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: (file: File) => emailService.uploadAttachment(file),
  });
}

export function useUploadMultipleAttachments() {
  return useMutation({
    mutationFn: (files: File[]) => emailService.uploadMultipleAttachments(files),
  });
}

export function useDownloadAttachment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ attachmentId, filename, emailId }: { attachmentId: string; filename: string; emailId?: string }) =>
      emailService.downloadAttachment(attachmentId, filename, emailId),
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to download attachment',
        variant: 'destructive',
      });
    },
  });
}

export function useGetAttachmentDownloadUrl() {
  return useMutation({
    mutationFn: (attachmentId: string) => emailService.getAttachmentDownloadUrl(attachmentId),
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (emailIds: string[]) => emailService.bulkDelete(emailIds),
    onSuccess: async (data) => {
      // Bulk delete affects all folders
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete emails',
        variant: 'destructive',
      });
    },
  });
}

export function useBulkToggleStar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ emailIds, star }: { emailIds: string[]; star: boolean }) =>
      emailService.bulkToggleStar(emailIds, star),
    onSuccess: async (data) => {
      // Star affects starred and inbox folders
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails', 'starred'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails', 'inbox'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update emails',
        variant: 'destructive',
      });
    },
  });
}

export function useBulkMarkAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ emailIds, isRead }: { emailIds: string[]; isRead: boolean }) =>
      emailService.bulkMarkAsRead(emailIds, isRead),
    onSuccess: async (data) => {
      // Read status affects mailbox counts and current view
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update emails',
        variant: 'destructive',
      });
    },
  });
}

export function useSelectAllEmailIds() {
  return useMutation({
    mutationFn: ({ folder, filters }: { folder: string; filters?: EmailFilters }) =>
      emailService.getEmailSelection(folder, filters),
  });
}

export function useSnoozeEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ emailId, snoozeUntil }: { emailId: string; snoozeUntil: string }) =>
      emailService.snoozeEmail(emailId, snoozeUntil),
    onSuccess: async () => {
      // Snooze affects multiple views
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['mailboxes'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['emails'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['kanban'],
          refetchType: 'active'
        }),
      ]);
      
      toast({
        title: 'Email snoozed',
        description: 'Email has been snoozed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to snooze email',
        variant: 'destructive',
      });
    },
  });
}

export function useUnsnoozeEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (emailId: string) => emailService.unsnoozeEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast({
        title: 'Email unsnoozed',
        description: 'Email has been restored to inbox',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to unsnooze email',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEmailLabels() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ emailId, labels }: { emailId: string; labels: string[] }) =>
      emailService.updateEmailLabels(emailId, labels),
    onSuccess: async () => {
      // Invalidate all email-related queries and wait for refetch
      await queryClient.invalidateQueries({ 
        queryKey: ['emails'],
        refetchType: 'all' // Refetch all matching queries, not just active ones
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['email'],
        refetchType: 'all'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['mailboxes'],
        refetchType: 'all'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update labels',
        variant: 'destructive',
      });
    },
  });
}
