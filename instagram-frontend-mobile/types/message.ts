import { UserProfile } from './user';

export interface Conversation {
  conversationId: string;
  otherUser: UserProfile;
  lastMessage?: Message;
  unreadCount?: number;
  lastMessageTime: string;
  isPinned?: boolean;
  isDeleted?: boolean;
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
