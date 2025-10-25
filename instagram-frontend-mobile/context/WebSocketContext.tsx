import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { webSocketService, WebSocketConfig, MessageCallbacks, ChatMessage } from '../services/websocket';
import { useAuth } from '../hooks/useAuth';
import apiConfig from '../config/apiConfig';

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  sendMessage: (receiverId: string, content: string, mediaUrl?: string) => void;
  sendTyping: (receiverId: string) => void;
  sendStopTyping: (receiverId: string) => void;
  sendReadReceipt: (messageId: string, senderId: string) => void;
  onMessage: (callback: (message: ChatMessage) => void) => void;
  onTyping: (callback: (isTyping: boolean, userId: string) => void) => void;
  onReadReceipt: (callback: (messageId: string, userId: string) => void) => void;
  onUserOnline: (callback: (userId: string) => void) => void;
  onUserOffline: (callback: (userId: string) => void) => void;
  onConnectionStatusChange: (callback: (status: string) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('disconnected');
  const messageCallbacksRef = useRef<{
    onMessage?: (message: ChatMessage) => void;
    onTyping?: (isTyping: boolean, userId: string) => void;
    onReadReceipt?: (messageId: string, userId: string) => void;
    onUserOnline?: (userId: string) => void;
    onUserOffline?: (userId: string) => void;
    onConnectionStatusChange?: (status: string) => void;
  }>({});

  const connectWebSocket = useCallback(async () => {
    if (!user || !token) {
      return;
    }

    // Use HTTP URL for SockJS (not ws://)
    // Backend has context-path=/api, so WebSocket endpoint is /api/ws
    const wsUrl = apiConfig.wsUrl || 'http://192.168.100.2:8080';
    const fullUrl = `${wsUrl}/api/ws`; // Remove token from URL, will be sent via headers
  
  const config: WebSocketConfig = {
    url: fullUrl,
    userId: user.id,
    username: user.username,
    token: token,
  };

    const callbacks: MessageCallbacks = {
      onMessage: (message: ChatMessage) => {
        messageCallbacksRef.current.onMessage?.(message);
      },
      onTyping: (isTyping: boolean, userId: string) => {
        messageCallbacksRef.current.onTyping?.(isTyping, userId);
      },
      onReadReceipt: (messageId: string, userId: string) => {
        messageCallbacksRef.current.onReadReceipt?.(messageId, userId);
      },
      onUserOnline: (userId: string) => {
        messageCallbacksRef.current.onUserOnline?.(userId);
      },
      onUserOffline: (userId: string) => {
        messageCallbacksRef.current.onUserOffline?.(userId);
      },
      onConnected: () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        messageCallbacksRef.current.onConnectionStatusChange?.('connected');
        
        // Show success notification
        console.log('WebSocket đã kết nối thành công.');
      },
      onDisconnected: () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        messageCallbacksRef.current.onConnectionStatusChange?.('disconnected');
      },
      onReconnecting: () => {
        setConnectionStatus('reconnecting');
        messageCallbacksRef.current.onConnectionStatusChange?.('reconnecting');
      },
      onReconnected: () => {
        setConnectionStatus('connected');
        messageCallbacksRef.current.onConnectionStatusChange?.('connected');
        console.log('WebSocket đã kết nối thành công.');
      },
      onError: (error: string) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        messageCallbacksRef.current.onConnectionStatusChange?.('disconnected');
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

  const sendMessage = useCallback((receiverId: string, content: string, mediaUrl?: string) => {
    webSocketService.sendMessage(receiverId, content, mediaUrl);
  }, []);

  const sendTyping = useCallback((receiverId: string) => {
    webSocketService.sendTyping(receiverId);
  }, []);

  const sendStopTyping = useCallback((receiverId: string) => {
    webSocketService.sendStopTyping(receiverId);
  }, []);

  const sendReadReceipt = useCallback((messageId: string, senderId: string) => {
    webSocketService.sendReadReceipt(messageId, senderId);
  }, []);

  const onMessage = useCallback((callback: (message: ChatMessage) => void) => {
    messageCallbacksRef.current.onMessage = callback;
  }, []);

  const onTyping = useCallback((callback: (isTyping: boolean, userId: string) => void) => {
    messageCallbacksRef.current.onTyping = callback;
  }, []);

  const onReadReceipt = useCallback((callback: (messageId: string, userId: string) => void) => {
    messageCallbacksRef.current.onReadReceipt = callback;
  }, []);

  const onUserOnline = useCallback((callback: (userId: string) => void) => {
    messageCallbacksRef.current.onUserOnline = callback;
  }, []);

  const onUserOffline = useCallback((callback: (userId: string) => void) => {
    messageCallbacksRef.current.onUserOffline = callback;
  }, []);

  const onConnectionStatusChange = useCallback((callback: (status: string) => void) => {
    messageCallbacksRef.current.onConnectionStatusChange = callback;
  }, []);

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
