import type { SearchResponse, SuggestionResponse } from "@/types/search";

import api from "./api-client";

export type {
  SearchMetadata,
  SearchResponse,
  SearchResult,
  SuggestionResponse,
} from "@/types/search";

export const searchService = {
  async search(
    query: string,
    folder?: string,
    limit?: number,
    includeSemantic?: boolean
  ): Promise<SearchResponse> {
    try {
      const params: Record<string, string | number | boolean> = { q: query };
      if (folder) params.folder = folder;
      if (limit) params.limit = limit;
      if (includeSemantic !== undefined) params.semantic = includeSemantic;

      const response = await api.get("search", { params });
      return response.data;
    } catch (_error: unknown) {
      return {
        results: [],
        total: 0,
        query,
        metadata: {
          semanticSearchUsed: false,
          semanticSearchError: true,
          hasApiKey: false,
          totalResults: 0,
        },
      };
    }
  },

  async getContactSuggestions(query: string, limit?: number): Promise<string[]> {
    try {
      const params: Record<string, string | number> = { q: query };
      if (limit) params.limit = limit;

      const response = await api.get<SuggestionResponse>("search/suggestions/contacts", {
        params,
      });
      return response.data.suggestions;
    } catch (error) {
      return [];
    }
  },

  async getKeywordSuggestions(query: string, limit?: number): Promise<string[]> {
    try {
      const params: Record<string, string | number> = { q: query };
      if (limit) params.limit = limit;

      const response = await api.get<SuggestionResponse>("search/suggestions/keywords", {
        params,
      });
      return response.data.suggestions;
    } catch (error) {
      return [];
    }
  },
};
