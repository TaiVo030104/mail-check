import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "@/constants/query-keys";
import { useToast } from "@/hooks/use-toast";
import { kanbanService } from "@/services/kanban";
import type {
  CreateColumnDto,
  KanbanBoard,
  KanbanColumn,
  MoveCardDto,
  UpdateColumnDto,
} from "@/types/kanban";

export { QueryKeys };

export function useInitializeKanban() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => kanbanService.initializeBoard(),
    onSuccess: (data) => {
      queryClient.setQueryData(QueryKeys.kanban.board(), data);
      toast({
        title: "Kanban Initialized",
        description: "Your Kanban board has been set up successfully.",
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Initialization Failed",
        description: error.response?.data?.message || "Failed to initialize Kanban board",
        variant: "destructive",
      });
    },
  });
}

export function useKanbanBoard() {
  return useQuery({
    queryKey: QueryKeys.kanban.board(),
    queryFn: () => kanbanService.getBoard(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateColumnDto) => kanbanService.createColumn(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QueryKeys.kanban.board() });
      await queryClient.refetchQueries({ queryKey: QueryKeys.kanban.board() });
      toast({
        title: "Column Created",
        description: "New column has been added to your board.",
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Failed to Create Column",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: UpdateColumnDto }) =>
      kanbanService.updateColumn(columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.kanban.board() });
      toast({
        title: "Column Updated",
        description: "Column has been updated successfully.",
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Failed to Update Column",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (columnId: string) => kanbanService.deleteColumn(columnId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.kanban.board() });
      toast({
        title: "Column Deleted",
        description: `Column deleted. ${data.movedCards} card(s) moved to inbox.`,
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Failed to Delete Column",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: MoveCardDto) => kanbanService.moveCard(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.kanban.board() });
      const previousBoard = queryClient.getQueryData(QueryKeys.kanban.board());

      queryClient.setQueryData(QueryKeys.kanban.board(), (old: KanbanBoard | undefined) => {
        if (!old) return old;

        const newColumns = old.columns.map((col: KanbanColumn) => {
          if (col.id === data.fromColumn) {
            return {
              ...col,
              cards: col.cards.filter((card) => card.emailId !== data.emailId),
            };
          }
          if (col.id === data.toColumn) {
            const card = old.columns
              .find((c: KanbanColumn) => c.id === data.fromColumn)
              ?.cards.find((card) => card.emailId === data.emailId);

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
    onError: (error: Error & { response?: { data?: { message?: string } } }, _, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(QueryKeys.kanban.board(), context.previousBoard);
      }
      toast({
        title: "Failed to Move Card",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.kanban.board() });

      if (data.synced) {
        toast({
          title: "Card Moved & Synced",
          description: "Card moved and Gmail labels updated.",
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.kanban.board() });
    },
  });
}

export function useAddEmailToBoard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ emailId, columnId }: { emailId: string; columnId?: string }) =>
      kanbanService.addEmail(emailId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.kanban.board() });
      toast({
        title: "Email Added",
        description: "Email has been added to your Kanban board.",
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Failed to Add Email",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
}

export function useRemoveEmailFromBoard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (emailId: string) => kanbanService.removeEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.kanban.board() });
      toast({
        title: "Email Removed",
        description: "Email has been removed from your Kanban board.",
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Failed to Remove Email",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
}
