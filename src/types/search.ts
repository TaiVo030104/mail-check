import { Email } from "./email";

export interface SearchResult {
  email: Email;
  relevanceScore: number;
  matchType: "exact" | "fuzzy" | "semantic" | "partial";
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
  type: "contacts" | "keywords";
}

export interface ContactSuggestion {
  email: string;
  name?: string;
  count?: number;
}

export interface KeywordSuggestion {
  keyword: string;
  count?: number;
}
