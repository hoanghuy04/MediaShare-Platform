import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { messageAPI } from '../services/message.service';
import { Conversation } from '../types';

// ========================================
// Types
// ========================================

type ConversationStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ConversationEntry {
  data?: Conversation;
  status: ConversationStatus;
  error?: string | null;
}

type ConversationState = Record<string, ConversationEntry>;

interface ConversationContextValue {
  /**
   * Cache của tất cả conversations theo conversationId
   */
  conversations: Record<string, ConversationEntry>;

  /**
   * Lấy conversation từ cache hoặc fetch từ server
   * - Nếu đã có trong cache và status === 'loaded', trả về ngay
   * - Nếu status === 'loading', đợi promise hiện tại
   * - Nếu status === 'idle' | 'error', fetch từ server
   * @returns Conversation hoặc null nếu có lỗi
   */
  getConversation: (
    conversationId: string
  ) => Promise<Conversation | null>;

  /**
   * Cập nhật local conversation (merge patch vào data hiện tại)
   * Dùng khi đổi tên, avatar, theme, wallpaper...
   */
  updateConversationLocal: (
    conversationId: string,
    patch: Partial<Conversation>
  ) => void;

  /**
   * Ghi đè toàn bộ conversation (sau khi gọi API update thành công)
   */
  setConversation: (conversation: Conversation) => void;

  /**
   * Ép reload data từ server, bỏ qua cache
   */
  refreshConversation: (
    conversationId: string
  ) => Promise<Conversation | null>;
}

// ========================================
// Context
// ========================================

const ConversationContext = createContext<
  ConversationContextValue | undefined
>(undefined);

// ========================================
// Provider
// ========================================

export const ConversationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationState>(
    {}
  );

  // Map để track các promise đang pending (tránh fetch trùng lặp)
  const pendingPromises = useMemo(
    () => new Map<string, Promise<Conversation | null>>(),
    []
  );

  /**
   * Fetch conversation từ server
   */
  const fetchConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      // Set status loading
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          status: 'loading',
          error: null,
        },
      }));

      try {
        const data = await messageAPI.getConversation(conversationId);

        // Set status loaded
        setConversations(prev => ({
          ...prev,
          [conversationId]: {
            data,
            status: 'loaded',
            error: null,
          },
        }));

        return data;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to fetch conversation';

        // Set status error
        setConversations(prev => ({
          ...prev,
          [conversationId]: {
            ...prev[conversationId],
            status: 'error',
            error: errorMessage,
          },
        }));

        return null;
      } finally {
        // Xóa promise khỏi pending map
        pendingPromises.delete(conversationId);
      }
    },
    [pendingPromises]
  );

  /**
   * Lấy conversation - tự động fetch nếu chưa có
   */
  const getConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      if (!conversationId) return null;

      const entry = conversations[conversationId];

      // Nếu đã loaded, trả về data ngay
      if (entry?.status === 'loaded' && entry.data) {
        return entry.data;
      }

      // Nếu đang loading, đợi promise hiện tại
      if (entry?.status === 'loading') {
        const pending = pendingPromises.get(conversationId);
        if (pending) {
          return pending;
        }
      }

      // Nếu idle hoặc error, fetch mới
      const promise = fetchConversation(conversationId);
      pendingPromises.set(conversationId, promise);
      return promise;
    },
    [conversations, fetchConversation, pendingPromises]
  );

  /**
   * Refresh conversation - luôn luôn fetch từ server
   */
  const refreshConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      if (!conversationId) return null;

      // Bỏ qua cache, luôn fetch mới
      const promise = fetchConversation(conversationId);
      pendingPromises.set(conversationId, promise);
      return promise;
    },
    [fetchConversation, pendingPromises]
  );

  /**
   * Set toàn bộ conversation (từ API response)
   */
  const setConversation = useCallback((conversation: Conversation) => {
    if (!conversation?.id) return;

    setConversations(prev => ({
      ...prev,
      [conversation.id]: {
        data: conversation,
        status: 'loaded',
        error: null,
      },
    }));
  }, []);

  /**
   * Update local conversation (merge patch)
   */
  const updateConversationLocal = useCallback(
    (conversationId: string, patch: Partial<Conversation>) => {
      if (!conversationId) return;

      setConversations(prev => {
        const entry = prev[conversationId];

        // Chỉ update nếu đã có data và status === 'loaded'
        if (!entry || entry.status !== 'loaded' || !entry.data) {
          return prev;
        }

        return {
          ...prev,
          [conversationId]: {
            ...entry,
            data: {
              ...entry.data,
              ...patch,
            },
          },
        };
      });
    },
    []
  );

  const value = useMemo<ConversationContextValue>(
    () => ({
      conversations,
      getConversation,
      updateConversationLocal,
      setConversation,
      refreshConversation,
    }),
    [
      conversations,
      getConversation,
      updateConversationLocal,
      setConversation,
      refreshConversation,
    ]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

// ========================================
// Hooks
// ========================================

/**
 * Hook để lấy conversation theo ID
 * Tự động fetch khi conversationId thay đổi
 * 
 * @example
 * const { conversation, status, loading, error, refresh } = useConversation(conversationId);
 */
export function useConversation(
  conversationId: string | null | undefined
): {
  conversation: Conversation | null;
  status: ConversationStatus;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error(
      'useConversation must be used within a ConversationProvider'
    );
  }

  const { conversations, getConversation, refreshConversation } =
    context;

  // Nếu conversationId là falsy, trả về giá trị rỗng
  if (!conversationId) {
    return {
      conversation: null,
      status: 'idle',
      error: null,
      loading: false,
      refresh: async () => {},
    };
  }

  const entry = conversations[conversationId];

  // Tự động fetch khi conversationId thay đổi
  useEffect(() => {
    if (conversationId) {
      getConversation(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const refresh = useCallback(async () => {
    if (conversationId) {
      await refreshConversation(conversationId);
    }
  }, [conversationId, refreshConversation]);

  return {
    conversation: entry?.data || null,
    status: entry?.status || 'idle',
    error: entry?.error || null,
    loading: entry?.status === 'loading',
    refresh,
  };
}

/**
 * Hook để lấy các actions của conversation context
 * Dùng khi cần gọi các actions mà không cần subscribe vào conversation cụ thể
 * 
 * @example
 * const { getConversation, setConversation, updateConversationLocal, refreshConversation } = useConversationActions();
 */
export function useConversationActions() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error(
      'useConversationActions must be used within a ConversationProvider'
    );
  }

  return {
    getConversation: context.getConversation,
    setConversation: context.setConversation,
    updateConversationLocal: context.updateConversationLocal,
    refreshConversation: context.refreshConversation,
  };
}
