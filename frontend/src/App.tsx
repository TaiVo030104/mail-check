import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorFallback } from "@/components/error-fallback";
import { PageNotFound } from "@/components/page-not-found";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { routeTree } from "@/routeTree.gen";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: (error) => {
        if (error instanceof AxiosError) {
          return (error.response?.status ?? 0) >= 500;
        }
        return false;
      },
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status ?? 0;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status ?? 0;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        toast({
          title: "Background update failed",
          description:
            error instanceof AxiosError
              ? (error.response?.data as { message?: string })?.message || error.message
              : "An unexpected error occurred",
          variant: "destructive",
        });
      }
    },
  }),
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultNotFoundComponent: () => <PageNotFound />,
  defaultErrorComponent: () => <ErrorFallback />,
});

export function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
