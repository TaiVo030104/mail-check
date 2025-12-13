import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kanbanService, CreateColumnDto, UpdateColumnDto, MoveCardDto } from '@/services/kanban';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const kanbanKeys = {
  all: ['kanban'] as const,
  board: () => [...kanbanKeys.all, 'board'] as const,
};

/**
 * Initialize Kanban board
 */
export function useInitializeKanban() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => kanbanService.initializeBoard(),
    onSuccess: (data) => {
      queryClient.setQueryData(kanbanKeys.board(), data);
      toast({
        title: 'Kanban Initialized',
        description: 'Your Kanban board has been set up successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Initialization Failed',
        description: error.response?.data?.message || 'Failed to initialize Kanban board',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get Kanban board
 */
export function useKanbanBoard() {
  return useQuery({
    queryKey: kanbanKeys.board(),
    queryFn: () => kanbanService.getBoard(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create column
 */
export function useCreateColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateColumnDto) => kanbanService.createColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      toast({
        title: 'Column Created',
        description: 'New column has been added to your board.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Create Column',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update column
 */
export function useUpdateColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: UpdateColumnDto }) =>
      kanbanService.updateColumn(columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      toast({
        title: 'Column Updated',
        description: 'Column has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Update Column',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete column
 */
export function useDeleteColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (columnId: string) => kanbanService.deleteColumn(columnId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      toast({
        title: 'Column Deleted',
        description: `Column deleted. ${data.movedCards} card(s) moved to inbox.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Delete Column',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Move card between columns
 */
export function useMoveCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: MoveCardDto) => kanbanService.moveCard(data),
    onMutate: async (data) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: kanbanKeys.board() });
      const previousBoard = queryClient.getQueryData(kanbanKeys.board());
      
      // Update cache optimistically
      queryClient.setQueryData(kanbanKeys.board(), (old: any) => {
        if (!old) return old;
        
        const newColumns = old.columns.map((col: any) => {
          if (col.id === data.fromColumn) {
            return {
              ...col,
              cards: col.cards.filter((card: any) => card.emailId !== data.emailId),
            };
          }
          if (col.id === data.toColumn) {
            const card = old.columns
              .find((c: any) => c.id === data.fromColumn)
              ?.cards.find((card: any) => card.emailId === data.emailId);
            
            return {
              ...col,
              cards: card ? [card, ...col.cards] : col.cards,
            };
          }
          return col;
        });
        
        return { ...old, columns: newColumns };
      });
      
      return { previousBoard };
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(kanbanKeys.board(), context.previousBoard);
      }
      toast({
        title: 'Failed to Move Card',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      
      if (data.synced) {
        toast({
          title: 'Card Moved & Synced',
          description: 'Card moved and Gmail labels updated.',
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
    },
  });
}

/**
 * Add email to board
 */
export function useAddEmailToBoard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ emailId, columnId }: { emailId: string; columnId?: string }) =>
      kanbanService.addEmail(emailId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      toast({
        title: 'Email Added',
        description: 'Email has been added to your Kanban board.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Email',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove email from board
 */
export function useRemoveEmailFromBoard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (emailId: string) => kanbanService.removeEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
      toast({
        title: 'Email Removed',
        description: 'Email has been removed from your Kanban board.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Remove Email',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}
