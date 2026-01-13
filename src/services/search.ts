import api from './apiClient';
import { Email } from './email';

export interface SearchResult {
  email: Email;
  relevanceScore: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'partial';
}

export interface SearchMetadata {
  semanticSearchUsed: boolean;
  semanticSearchError: boolean;
  hasApiKey: boolean;
  totalResults: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  metadata?: SearchMetadata;
}

export interface SuggestionResponse {
  suggestions: string[];
  type: 'contacts' | 'keywords';
}

export const searchService = {
  async search(
    query: string,
    folder?: string,
    limit?: number,
    includeSemantic?: boolean,
  ): Promise<SearchResponse> {
    try {
      const params: any = { q: query };
      if (folder) params.folder = folder;
      if (limit) params.limit = limit;
      if (includeSemantic !== undefined) params.semantic = includeSemantic;

      const response = await api.get('search', { params });
      return response.data;
    } catch (error: any) {
      console.error('Search error:', error);
      // Return empty results on error instead of throwing
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
      const params: any = { q: query };
      if (limit) params.limit = limit;

      const response = await api.get<SuggestionResponse>('search/suggestions/contacts', {
        params,
      });
      return response.data.suggestions;
    } catch (error) {
      console.error('Error getting contact suggestions:', error);
      return [];
    }
  },

  async getKeywordSuggestions(query: string, limit?: number): Promise<string[]> {
    try {
      const params: any = { q: query };
      if (limit) params.limit = limit;

      const response = await api.get<SuggestionResponse>('search/suggestions/keywords', {
        params,
      });
      return response.data.suggestions;
    } catch (error) {
      console.error('Error getting keyword suggestions:', error);
      return [];
    }
  },
};

