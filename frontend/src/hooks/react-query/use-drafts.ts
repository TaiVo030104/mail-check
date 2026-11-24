import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "@/constants/query-keys";
import { createDraft, deleteDraft, getDraft, getDrafts, updateDraft } from "@/services/drafts";
import type { CreateDraftDto, UpdateDraftDto } from "@/types/draft";

export { QueryKeys };

export function useDrafts() {
  return useQuery({
    queryKey: QueryKeys.drafts.all,
    queryFn: getDrafts,
    staleTime: 1000 * 60,
  });
}

export function useDraft(draftId: string | null) {
  return useQuery({
    queryKey: QueryKeys.drafts.detail(draftId!),
    queryFn: () => getDraft(draftId!),
    enabled: !!draftId,
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftDto: CreateDraftDto) => createDraft(draftDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.drafts.all });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draftId, updateDto }: { draftId: string; updateDto: UpdateDraftDto }) =>
      updateDraft(draftId, updateDto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.drafts.all });
      queryClient.invalidateQueries({ queryKey: QueryKeys.drafts.detail(variables.draftId) });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => deleteDraft(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.drafts.all });
    },
  });
}
