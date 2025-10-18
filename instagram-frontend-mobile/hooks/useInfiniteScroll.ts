import { useState, useCallback } from 'react';
import { PaginatedResponse } from '@types';

interface UseInfiniteScrollOptions<T> {
  fetchFunc: (page: number, limit: number) => Promise<PaginatedResponse<T>>;
  limit?: number;
  onError?: (error: Error) => void;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  page: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useInfiniteScroll = <T>({
  fetchFunc,
  limit = 20,
  onError,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const response = await fetchFunc(pageNum, limit);
        
        if (isRefresh || pageNum === 1) {
          setData(response.data);
        } else {
          setData(prev => [...prev, ...response.data]);
        }
        
        setHasMore(response.hasMore);
        setPage(pageNum);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [fetchFunc, limit, onError]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    await loadData(page + 1);
  }, [hasMore, isLoading, isLoadingMore, page, loadData]);

  const refresh = useCallback(async () => {
    setHasMore(true);
    await loadData(1, true);
  }, [loadData]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    page,
    loadMore,
    refresh,
    reset,
  };
};

