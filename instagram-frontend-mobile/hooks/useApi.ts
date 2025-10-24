import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiReturn<T, P extends any[]> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (...args: P) => Promise<T | null>;
  reset: () => void;
}

export const useApi = <T, P extends any[] = []>(
  apiFunc: (...args: P) => Promise<T>,
  options?: UseApiOptions<T>
): UseApiReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiFunc(...args);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as AxiosError;
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        const appError = new Error(errorMessage);
        setError(appError);
        options?.onError?.(appError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunc, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
};

