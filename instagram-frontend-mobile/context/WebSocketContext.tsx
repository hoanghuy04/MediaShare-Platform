import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import {
  webSocketService,
  WebSocketConfig,
  MessageCallbacks,
  ChatMessage,
} from '../services/websocket';
import { useAuth } from '../hooks/useAuth';
import apiConfig from '../config/apiConfig';

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  sendMessage: (receiverId: string, content: string) => void;
  sendTyping: (receiverOrConversationId: string, isConversationId?: boolean) => void;
  sendStopTyping: (receiverOrConversationId: string, isConversationId?: boolean) => void;
  sendReadReceipt: (messageId: string, senderId: string) => void;

  // ⚠️ Các hàm onX bây giờ trả về hàm unsubscribe
  onMessage: (callback: (message: ChatMessage) => void) => () => void;
  onTyping: (
    callback: (isTyping: boolean, userId: string, conversationId?: string) => void
  ) => () => void;
  onReadReceipt: (
    callback: (messageId: string, userId: string, conversationId?: string) => void
  ) => () => void;
  onUserOnline: (callback: (userId: string) => void) => () => void;
  onUserOffline: (callback: (userId: string) => void) => () => void;
  onConnectionStatusChange: (callback: (status: string) => void) => () => void;
  onConversationUpdate: (
    callback: (update: { conversationId: string; updateType: string; data: any }) => void
  ) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

type Subscribers = {
  onMessage: Set<(message: ChatMessage) => void>;
  onTyping: Set<(isTyping: boolean, userId: string, conversationId?: string) => void>;
  onReadReceipt: Set<(messageId: string, userId: string, conversationId?: string) => void>;
  onUserOnline: Set<(userId: string) => void>;
  onUserOffline: Set<(userId: string) => void>;
  onConnectionStatusChange: Set<(status: string) => void>;
  onConversationUpdate: Set<(update: { conversationId: string; updateType: string; data: any }) => void>;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  >('disconnected');

  // 🔥 Dùng Set để hỗ trợ nhiều subscriber cho mỗi event
  const subscribersRef = useRef<Subscribers>({
    onMessage: new Set(),
    onTyping: new Set(),
    onReadReceipt: new Set(),
    onUserOnline: new Set(),
    onUserOffline: new Set(),
    onConnectionStatusChange: new Set(),
    onConversationUpdate: new Set(),
  });

  const connectWebSocket = useCallback(async () => {
    if (!user || !token) {
      return;
    }

    // Backend có context-path=/api, endpoint WS = /api/ws
    const wsUrl = apiConfig.wsUrl || 'http://192.168.100.2:8080';
    const fullUrl = `${wsUrl}/api/ws`;

    const config: WebSocketConfig = {
      url: fullUrl,
      userId: user.id,
      username: user.username,
      token: token,
    };

    const callbacks: MessageCallbacks = {
      onMessage: (message: ChatMessage) => {
        subscribersRef.current.onMessage.forEach(cb => cb(message));
      },
      onTyping: (isTyping: boolean, userId: string, conversationId?: string) => {
        subscribersRef.current.onTyping.forEach(cb => cb(isTyping, userId, conversationId));
      },
      onReadReceipt: (messageId: string, userId: string, conversationId?: string) => {
        subscribersRef.current.onReadReceipt.forEach(cb =>
          cb(messageId, userId, conversationId)
        );
      },
      onUserOnline: (userId: string) => {
        subscribersRef.current.onUserOnline.forEach(cb => cb(userId));
      },
      onUserOffline: (userId: string) => {
        subscribersRef.current.onUserOffline.forEach(cb => cb(userId));
      },
      onConversationUpdate: (update: { conversationId: string; updateType: string; data: any }) => {
        subscribersRef.current.onConversationUpdate.forEach(cb => cb(update));
      },
      onConnected: () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        subscribersRef.current.onConnectionStatusChange.forEach(cb => cb('connected'));
        console.log('WebSocket đã kết nối thành công.');
      },
      onDisconnected: () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        subscribersRef.current.onConnectionStatusChange.forEach(cb => cb('disconnected'));
      },
      onReconnecting: () => {
        setConnectionStatus('reconnecting');
        subscribersRef.current.onConnectionStatusChange.forEach(cb => cb('reconnecting'));
      },
      onReconnected: () => {
        setConnectionStatus('connected');
        subscribersRef.current.onConnectionStatusChange.forEach(cb => cb('connected'));
        console.log('WebSocket đã kết nối lại thành công.');
      },
      onError: (error: string) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        subscribersRef.current.onConnectionStatusChange.forEach(cb => cb('disconnected'));
      },
    };

    try {
      await webSocketService.connect(config, callbacks);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [user, token]);

  const disconnectWebSocket = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (user && token) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, token, connectWebSocket, disconnectWebSocket]);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    webSocketService.sendMessage(receiverId, content);
  }, []);

  const sendTyping = useCallback(
    (receiverOrConversationId: string, isConversationId = false) => {
      webSocketService.sendTyping(receiverOrConversationId, isConversationId);
    },
    []
  );

  const sendStopTyping = useCallback(
    (receiverOrConversationId: string, isConversationId = false) => {
      webSocketService.sendStopTyping(receiverOrConversationId, isConversationId);
    },
    []
  );

  const sendReadReceipt = useCallback((messageId: string, senderId: string) => {
    webSocketService.sendReadReceipt(messageId, senderId);
  }, []);

  // 🧹 Các hàm đăng ký listener, trả về hàm unsubscribe
  const onMessage = useCallback(
    (callback: (message: ChatMessage) => void) => {
      subscribersRef.current.onMessage.add(callback);
      return () => {
        subscribersRef.current.onMessage.delete(callback);
      };
    },
    []
  );

  const onTyping = useCallback(
    (callback: (isTyping: boolean, userId: string, conversationId?: string) => void) => {
      subscribersRef.current.onTyping.add(callback);
      return () => {
        subscribersRef.current.onTyping.delete(callback);
      };
    },
    []
  );

  const onReadReceipt = useCallback(
    (
      callback: (messageId: string, userId: string, conversationId?: string) => void
    ) => {
      subscribersRef.current.onReadReceipt.add(callback);
      return () => {
        subscribersRef.current.onReadReceipt.delete(callback);
      };
    },
    []
  );

  const onUserOnline = useCallback((callback: (userId: string) => void) => {
    subscribersRef.current.onUserOnline.add(callback);
    return () => {
      subscribersRef.current.onUserOnline.delete(callback);
    };
  }, []);

  const onUserOffline = useCallback((callback: (userId: string) => void) => {
    subscribersRef.current.onUserOffline.add(callback);
    return () => {
      subscribersRef.current.onUserOffline.delete(callback);
    };
  }, []);

  const onConnectionStatusChange = useCallback((callback: (status: string) => void) => {
    subscribersRef.current.onConnectionStatusChange.add(callback);
    return () => {
      subscribersRef.current.onConnectionStatusChange.delete(callback);
    };
  }, []);

  const onConversationUpdate = useCallback(
    (callback: (update: { conversationId: string; updateType: string; data: any }) => void) => {
      subscribersRef.current.onConversationUpdate.add(callback);
      return () => {
        subscribersRef.current.onConversationUpdate.delete(callback);
      };
    },
    []
  );

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionStatus,
    sendMessage,
    sendTyping,
    sendStopTyping,
    sendReadReceipt,
    onMessage,
    onTyping,
    onReadReceipt,
    onUserOnline,
    onUserOffline,
    onConnectionStatusChange,
    onConversationUpdate,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
