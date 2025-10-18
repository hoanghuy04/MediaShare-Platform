import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseFetchOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseFetchReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useFetch = <T>(
  fetchFunc: () => Promise<T>,
  options?: UseFetchOptions<T>
): UseFetchReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const enabled = options?.enabled !== undefined ? options.enabled : true;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFunc();
      setData(result);
      options?.onSuccess?.(result);
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      const appError = new Error(errorMessage);
      setError(appError);
      options?.onError?.(appError);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunc, enabled, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchData,
  };
};

