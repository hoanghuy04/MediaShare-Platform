import { UserProfile } from './user';

export interface Conversation {
  id: string;
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  sender: UserProfile;
  receiver: UserProfile;
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  receiverId: string;
  content: string;
  mediaUrl?: string;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  mediaUrl?: string;
}

export interface CreateConversationRequest {
  participantIds: string[];
}

export interface WebSocketMessage {
  type: 'MESSAGE' | 'TYPING' | 'READ' | 'ONLINE' | 'OFFLINE';
  data: any;
  timestamp: string;
}
