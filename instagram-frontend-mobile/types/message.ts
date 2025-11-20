import { UserProfile } from './user';

// User summary for message sender (lightweight)
export interface UserSummary {
  id: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
}

// Conversation member with role and participation details
export interface ConversationMember {
  userId: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
  joinedAt: string;
  leftAt?: string;
  role: 'ADMIN' | 'MEMBER';
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
  participants: ConversationMember[]; // Changed from UserSummary[] to ConversationMember[]
  admins?: string[];
  lastMessage?: LastMessage;
  createdAt: string;
  // Note: unreadCount removed - calculate on frontend from messages
}

// Message DTO (matches backend MessageDTO)
export interface Message {
  id: string;
  conversationId?: string;
  sender?: UserSummary;
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
  receiver: UserSummary;
  lastMessageContent?: string;
  lastMessageTimestamp?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IGNORED';
  createdAt: string;
}

// WebSocket message
export interface WebSocketMessage {
  type: 'MESSAGE' | 'TYPING' | 'READ' | 'ONLINE' | 'OFFLINE';
  data: any;
  timestamp: string;
}

// Inbox item (conversation or message request) - matches backend InboxItemDTO
export interface InboxItem {
  type: 'CONVERSATION' | 'MESSAGE_REQUEST';
  conversation?: Conversation;
  messageRequest?: MessageRequest;
  timestamp: string;
}
