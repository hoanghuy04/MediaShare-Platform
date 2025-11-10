import { UserProfile } from './user';

// User summary for conversation participants
export interface UserSummary {
  id: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
}

// Last message info
export interface LastMessage {
  messageId: string;
  content: string;
  senderId: string;
  senderUsername: string;
  timestamp: string;
}

// Conversation DTO (matches backend ConversationDTO)
export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string; // Group name
  avatar?: string; // Group avatar
  participants: UserSummary[];
  lastMessage?: LastMessage;
  createdAt: string;
  // Note: unreadCount removed - calculate on frontend from messages
}

// Message DTO (matches backend MessageDTO)
export interface Message {
  id: string;
  conversationId?: string;
  sender: UserSummary;
  content: string;
  mediaUrl?: string;
  readBy: string[]; // Changed from isRead: boolean
  replyTo?: Message; // For threading
  createdAt: string;
  isDeleted: boolean;
}

// Send message request
export interface SendMessageRequest {
  receiverId?: string; // For direct messages
  conversationId?: string; // For existing conversations
  content: string;
  mediaUrl?: string;
  replyToMessageId?: string; // For threading
}

// Message request (pending messages)
export interface MessageRequest {
  id: string;
  sender: UserSummary;
  firstMessage?: Message;
  pendingCount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IGNORED';
  createdAt: string;
}

// WebSocket message
export interface WebSocketMessage {
  type: 'MESSAGE' | 'TYPING' | 'READ' | 'ONLINE' | 'OFFLINE';
  data: any;
  timestamp: string;
}
