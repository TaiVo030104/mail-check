import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "@/constants/query-keys";
import { searchService } from "@/services/search";
import type { SearchResponse } from "@/types/search";

export { QueryKeys };

export function useSearch(
  query: string,
  folder?: string,
  limit?: number,
  includeSemantic?: boolean
) {
  return useQuery<SearchResponse>({
    queryKey: QueryKeys.search.results(query, folder),
    queryFn: () => searchService.search(query, folder, limit, includeSemantic),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}
