import { useState, useCallback, useRef, useEffect } from 'react';
import { PaginatedResponse } from '../types';

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
  updateItem: (id: string, updater: (item: T) => T) => void;
}

export const useInfiniteScroll = <T>({
  fetchFunc,
  limit = 20,
  onError,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use refs to store stable references
  const fetchFuncRef = useRef(fetchFunc);
  const limitRef = useRef(limit);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    fetchFuncRef.current = fetchFunc;
    limitRef.current = limit;
    onErrorRef.current = onError;
  }, [fetchFunc, limit, onError]);

  const loadData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        console.log(`Fetching data for page ${pageNum}, limit ${limitRef.current}`);
        const response = await fetchFuncRef.current(pageNum, limitRef.current);
        
        console.log('API response:', response);
        console.log('Response content:', response.content);
        console.log('Response hasNext:', response.hasNext);
        

        if (isRefresh || pageNum === 0) {
          setData(response.content);
        } else {
          setData(prev => [...prev, ...response.content]);
        }

        setHasMore(response.hasNext);
        setPage(pageNum);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onErrorRef.current?.(error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [] // Empty dependency array since we use refs
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    await loadData(page + 1);
  }, [hasMore, isLoading, isLoadingMore, page, loadData]);

  const refresh = useCallback(async () => {
    setHasMore(true);
    await loadData(0, true);
  }, [loadData]);

  const reset = useCallback(() => {
    setData([]);
    setPage(0);
    setHasMore(true);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(null);
  }, []);

  const updateItem = useCallback((id: string, updater: (item: T) => T) => {
    setData(prev => prev.map(item => {
      if ((item as any).id === id) {
        return updater(item);
      }
      return item;
    }));
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
    updateItem,
  };
};
