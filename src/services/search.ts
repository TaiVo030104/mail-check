import api from './apiClient';
import { Email } from './email';

export interface SearchResult {
  email: Email;
  relevanceScore: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'partial';
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
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
    const params: any = { q: query };
    if (folder) params.folder = folder;
    if (limit) params.limit = limit;
    if (includeSemantic !== undefined) params.semantic = includeSemantic;

    const response = await api.get('emails/search', { params });
    return response.data;
  },

  async getContactSuggestions(query: string, limit?: number): Promise<string[]> {
    const params: any = { q: query };
    if (limit) params.limit = limit;

    const response = await api.get<SuggestionResponse>('emails/search/suggestions/contacts', {
      params,
    });
    return response.data.suggestions;
  },

  async getKeywordSuggestions(query: string, limit?: number): Promise<string[]> {
    const params: any = { q: query };
    if (limit) params.limit = limit;

    const response = await api.get<SuggestionResponse>('emails/search/suggestions/keywords', {
      params,
    });
    return response.data.suggestions;
  },
};

