import { useEffect, useState } from "react";

import { swManager } from "@/services/service-worker";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ usage: 0, quota: 0, percentage: 0 });

  useEffect(() => {
    swManager.register().then((registration) => {
      setIsRegistered(registration !== null);
    });

    swManager.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    const updateStorage = async () => {
      const estimate = await swManager.getStorageEstimate();
      setStorageUsage(estimate);
    };

    updateStorage();
    const interval = setInterval(updateStorage, 60000);

    return () => clearInterval(interval);
  }, []);

  const updateServiceWorker = () => {
    swManager.skipWaiting();
    window.location.reload();
  };

  const clearCache = async () => {
    await swManager.clearCaches();
  };

  return {
    isRegistered,
    updateAvailable,
    updateServiceWorker,
    clearCache,
    storageUsage,
  };
}

export function useOfflineFirst<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options?: {
    enabled?: boolean;
    refetchOnReconnect?: boolean;
  }
) {
  const isOnline = useOnlineStatus();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        setData(result);
        setIsCached(false);

        if ("caches" in window) {
          const cache = await caches.open("email-client-data");
          await cache.put(
            new Request(cacheKey),
            new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      } catch (err) {
        if ("caches" in window) {
          const cache = await caches.open("email-client-data");
          const cached = await cache.match(cacheKey);

          if (cached) {
            const cachedData = await cached.json();
            setData(cachedData);
            setIsCached(true);
          } else {
            setError(err as Error);
          }
        } else {
          setError(err as Error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOnline, cacheKey, options?.enabled]);

  useEffect(() => {
    if (isOnline && isCached && options?.refetchOnReconnect !== false) {
      const fetchData = async () => {
        try {
          const result = await fetchFn();
          setData(result);
          setIsCached(false);
        } catch {
          // ignore - refetch failure is non-critical
        }
      };

      fetchData();
    }
  }, [isOnline, isCached, options?.refetchOnReconnect]);

  return {
    data,
    isLoading,
    error,
    isOnline,
    isCached,
  };
}
