import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "../components/ui/toast";

interface FetchOptions<T> {
  fetcher: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  autoFetch?: boolean;
  successMessage?: string;
}

export function useFetchWithLoader<T>({
  fetcher,
  onSuccess,
  onError,
  autoFetch = true,
  successMessage,
}: FetchOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const hasLoadedOnce = useRef(false);

  // Keep latest callbacks in refs so that `fetchData` stays stable across renders
  // (otherwise inline `fetcher` arrow functions create an infinite re-fetch loop).
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const successMessageRef = useRef(successMessage);

  useEffect(() => {
    fetcherRef.current = fetcher;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    successMessageRef.current = successMessage;
  });

  const fetchData = useCallback(async () => {
    // Only show skeleton on the very first fetch; background refetches are silent
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    try {
      const result = await fetcherRef.current();
      setData(result);
      hasLoadedOnce.current = true;
      if (successMessageRef.current) toast.success(successMessageRef.current);
      onSuccessRef.current?.(result);
    } catch (err) {
      setError(err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || err.message);
      } else {
        toast.error("Xatolik yuz berdi");
      }
      onErrorRef.current?.(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

  return { data, isLoading, error, refetch: fetchData };
}
