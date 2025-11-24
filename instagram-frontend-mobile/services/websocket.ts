import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Message, UserProfile } from '../types';

export interface ChatMessage {
  id?: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING' | 'STOP_TYPING' | 'READ';
  contentType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'POST_SHARE' | 'STICKER'; 
  senderId: string;
  senderUsername?: string;
  senderProfileImage?: string;
  receiverId: string;
  conversationId?: string;
  content?: string;
  mediaUrl?: string;
  timestamp: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
}

export interface WebSocketConfig {
  url: string;
  userId: string;
  username: string;
  token: string;
}

export interface MessageCallbacks {
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (isTyping: boolean, userId: string, conversationId?: string) => void;
  onReadReceipt?: (messageId: string, userId: string, conversationId?: string) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
}

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private config: WebSocketConfig | null = null;
  private callbacks: MessageCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isReconnecting = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' =
    'disconnected';
  private messageQueue: ChatMessage[] = [];
  private typingUsers: Set<string> = new Set();

  /**
   * Initialize WebSocket connection
   */
  async connect(config: WebSocketConfig, callbacks: MessageCallbacks): Promise<void> {
    this.config = config;
    this.callbacks = callbacks;

    console.log('WebSocket connection attempt:', {
      url: config.url,
      userId: config.userId,
      username: config.username,
      token: config.token ? 'Present' : 'Missing',
    });

    try {
      // Create SockJS connection with token in URL (SockJS doesn't support custom headers in handshake)
      const urlWithToken = `${config.url}?token=${encodeURIComponent(config.token)}`;
      const socket = new SockJS(urlWithToken);

      // Create STOMP client with proper headers
      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${config.token}`,
          'X-Auth-Token': config.token,
          userId: config.userId,
          username: config.username,
        },
        reconnectDelay: this.reconnectInterval,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      // Set up event handlers
      this.client.onConnect = this.onConnect.bind(this);
      this.client.onStompError = this.onError.bind(this);
      this.client.onWebSocketError = this.onError.bind(this);
      this.client.onWebSocketClose = this.onDisconnect.bind(this);

      // Activate the client
      this.client.activate();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.callbacks.onError?.('Failed to connect to WebSocket');
    }
  }

  /**
   * Handle successful connection
   */
  private onConnect(): void {
    console.log('WebSocket connected successfully');
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    // Subscribe to user-specific message queue
    this.subscribeToMessages();

    // Subscribe to typing indicators
    this.subscribeToTyping();

    // Subscribe to read receipts
    this.subscribeToReadReceipts();

    // Subscribe to user presence
    this.subscribeToPresence();

    // Subscribe to errors
    this.subscribeToErrors();

    // Notify user joined
    this.sendUserJoin();

    // Process queued messages
    this.processMessageQueue();

    this.callbacks.onConnected?.();
    if (this.isReconnecting) {
      this.callbacks.onReconnected?.();
    }
  }

  /**
   * Handle connection errors
   */
  private onError(error: any): void {
    console.error('WebSocket error:', error);
    this.connectionState = 'disconnected';
    this.callbacks.onError?.(error.message || 'WebSocket connection error');
  }

  /**
   * Handle disconnection
   */
  private onDisconnect(): void {
    this.callbacks.onDisconnected?.();

    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.connectionState = 'reconnecting';
      this.isReconnecting = true;
      this.callbacks.onReconnecting?.();

      setTimeout(() => {
        this.reconnect();
      }, this.reconnectInterval);
    } else {
      this.connectionState = 'disconnected';
    }
  }

  /**
   * Attempt to reconnect
   */
  private async reconnect(): Promise<void> {
    if (this.config) {
      try {
        await this.connect(this.config, this.callbacks);
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }
  }

  /**
   * Subscribe to messages queue
   */
  private subscribeToMessages(): void {
    if (!this.client || !this.config) return;

    const subscriptionDestination = `/user/${this.config.userId}/queue/messages`;
    console.log('Subscribing to messages:', subscriptionDestination);

    const subscription = this.client.subscribe(subscriptionDestination, (message: IMessage) => {
      try {
        console.log('Received message:', message.body);
        const chatMessage: ChatMessage = JSON.parse(message.body);

        // Update message status
        this.updateMessageStatus(chatMessage);

        // Call the message callback
        this.callbacks.onMessage?.(chatMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.subscriptions.set('messages', subscription);
  }

  /**
   * Subscribe to typing indicators
   */
  private subscribeToTyping(): void {
    if (!this.client || !this.config) return;

    const subscription = this.client.subscribe(
      `/user/${this.config.userId}/queue/typing`,
      (message: IMessage) => {
        try {
          console.log('📥 Raw typing message body:', message.body);
          const chatMessage: ChatMessage = JSON.parse(message.body);
          console.log('📦 Parsed typing message:', {
            type: chatMessage.type,
            senderId: chatMessage.senderId,
            conversationId: chatMessage.conversationId,
            receiverId: chatMessage.receiverId,
          });
          const isTyping = chatMessage.type === 'TYPING';
          this.callbacks.onTyping?.(isTyping, chatMessage.senderId, chatMessage.conversationId);
        } catch (error) {
          console.error('Error parsing typing indicator:', error);
        }
      }
    );

    this.subscriptions.set('typing', subscription);
  }

  /**
   * Subscribe to read receipts
   */
  private subscribeToReadReceipts(): void {
    if (!this.client || !this.config) return;

    const subscription = this.client.subscribe(
      `/user/${this.config.userId}/queue/read-receipts`,
      (message: IMessage) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.callbacks.onReadReceipt?.(
            chatMessage.id || '',
            chatMessage.senderId,
            chatMessage.conversationId
          );
        } catch (error) {
          console.error('Error parsing read receipt:', error);
        }
      }
    );

    this.subscriptions.set('readReceipts', subscription);
  }

  /**
   * Subscribe to user presence
   */
  private subscribeToPresence(): void {
    if (!this.client || !this.config) return;

    const subscription = this.client.subscribe(
      `/user/${this.config.userId}/queue/presence`,
      (message: IMessage) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          if (chatMessage.type === 'JOIN') {
            this.callbacks.onUserOnline?.(chatMessage.senderId);
          } else if (chatMessage.type === 'LEAVE') {
            this.callbacks.onUserOffline?.(chatMessage.senderId);
          }
        } catch (error) {
          console.error('Error parsing presence update:', error);
        }
      }
    );

    this.subscriptions.set('presence', subscription);
  }

  /**
   * Subscribe to errors
   */
  private subscribeToErrors(): void {
    if (!this.client || !this.config) return;

    const subscription = this.client.subscribe(
      `/user/${this.config.userId}/queue/errors`,
      (message: IMessage) => {
        try {
          const errorMessage = JSON.parse(message.body);
          this.callbacks.onError?.(errorMessage.content || 'WebSocket error');
        } catch (error) {
          console.error('Error parsing error message:', error);
        }
      }
    );

    this.subscriptions.set('errors', subscription);
  }

  /**
   * Send user join notification
   */
  private sendUserJoin(): void {
    if (!this.client || !this.config) return;

    const joinMessage: ChatMessage = {
      type: 'JOIN',
      senderId: this.config.userId,
      senderUsername: this.config.username,
      receiverId: '',
      timestamp: new Date().toISOString(),
    };

    this.client.publish({
      destination: '/app/chat.join',
      body: JSON.stringify(joinMessage),
    });
  }

  /**
   * Send a chat message
   */
  sendMessage(receiverId: string, content: string, mediaUrl?: string): void {
    if (!this.client || !this.config) {
      console.error('WebSocket client not connected or config missing');
      return;
    }

    const chatMessage: ChatMessage = {
      type: 'CHAT',
      senderId: this.config.userId,
      receiverId,
      content,
      mediaUrl,
      timestamp: new Date().toISOString(),
      status: 'SENT',
    };

    console.log('Sending WebSocket message:', chatMessage);
    console.log('Publishing to destination: /app/chat.send');
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(chatMessage),
    });
  }

  /**
   * Send typing indicator
   * @param receiverOrConversationId - Can be either receiverId (direct) or conversationId (group)
   * @param isConversationId - If true, treats first param as conversationId
   */
  sendTyping(receiverOrConversationId: string, isConversationId = false): void {
    if (!this.client || !this.config) return;

    const typingMessage: ChatMessage = {
      type: 'TYPING',
      senderId: this.config.userId,
      receiverId: isConversationId ? '' : receiverOrConversationId,
      conversationId: isConversationId ? receiverOrConversationId : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('⚡ Sending typing indicator:', {
      isConversationId,
      conversationId: typingMessage.conversationId,
      receiverId: typingMessage.receiverId,
    });

    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(typingMessage),
    });
  }

  /**
   * Send stop typing indicator
   * @param receiverOrConversationId - Can be either receiverId (direct) or conversationId (group)
   * @param isConversationId - If true, treats first param as conversationId
   */
  sendStopTyping(receiverOrConversationId: string, isConversationId = false): void {
    if (!this.client || !this.config) return;

    const stopTypingMessage: ChatMessage = {
      type: 'STOP_TYPING',
      senderId: this.config.userId,
      receiverId: isConversationId ? '' : receiverOrConversationId,
      conversationId: isConversationId ? receiverOrConversationId : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('⚡ Sending stop typing indicator:', {
      isConversationId,
      conversationId: stopTypingMessage.conversationId,
      receiverId: stopTypingMessage.receiverId,
    });

    this.client.publish({
      destination: '/app/chat.stopTyping',
      body: JSON.stringify(stopTypingMessage),
    });
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(messageId: string, senderId: string): void {
    if (!this.client || !this.config) return;

    const readMessage: ChatMessage = {
      id: messageId,
      type: 'READ',
      senderId: this.config.userId,
      receiverId: senderId,
      timestamp: new Date().toISOString(),
      status: 'READ',
    };

    this.client.publish({
      destination: '/app/chat.read',
      body: JSON.stringify(readMessage),
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    // Unsubscribe from all topics
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    // Deactivate client
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    console.log('WebSocket disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length > 0) {
      console.log(`Processing ${this.messageQueue.length} queued messages`);
      this.messageQueue.forEach(message => {
        this.callbacks.onMessage?.(message);
      });
      this.messageQueue = [];
    }
  }

  /**
   * Update message status based on received message
   */
  private updateMessageStatus(chatMessage: ChatMessage): void {
    if (chatMessage.status) {
      console.log(`Message ${chatMessage.id} status: ${chatMessage.status}`);
    }
  }

  /**
   * Queue message for later processing if disconnected
   */
  private queueMessage(message: ChatMessage): void {
    this.messageQueue.push(message);
    console.log(`Message queued. Queue size: ${this.messageQueue.length}`);
  }

  /**
   * Get typing users
   */
  getTypingUsers(): string[] {
    return Array.from(this.typingUsers);
  }

  /**
   * Clear typing users
   */
  clearTypingUsers(): void {
    this.typingUsers.clear();
  }
}

export const webSocketService = new WebSocketService();
