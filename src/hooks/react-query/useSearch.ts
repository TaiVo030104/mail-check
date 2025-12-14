import { useQuery } from '@tanstack/react-query';
import { searchService, SearchResponse } from '@/services/search';

export function useSearch(
  query: string,
  folder?: string,
  limit?: number,
  includeSemantic?: boolean,
) {
  return useQuery<SearchResponse>({
    queryKey: ['search', query, folder, limit, includeSemantic],
    queryFn: () => searchService.search(query, folder, limit, includeSemantic),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

