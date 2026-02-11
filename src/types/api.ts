export interface ApiErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

export type { FetchingData, PagedData, PagingSchema } from "@/lib/types/pagination";
