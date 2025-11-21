import { Message, Conversation, ConversationMember, UserSummary } from '../types/message';

/**
 * Check if a message has been read by the current user
 */
export const isMessageRead = (message: Message, currentUserId: string): boolean => {
  return message.readBy.includes(currentUserId);
};

/**
 * Calculate unread count for messages array
 * Only counts messages sent by others that haven't been read by current user
 */
export const calculateUnreadCount = (
  messages: Message[],
  currentUserId: string
): number => {
  return messages.filter(
    (msg) =>
      msg.sender.id !== currentUserId && // Not sent by me
      !msg.readBy.includes(currentUserId) && // Not read by me
      !msg.isDeleted // Not deleted
  ).length;
};

/**
 * Check if conversation has unread messages based on last message
 */
export const hasUnreadMessages = (
  conversation: Conversation,
  currentUserId: string
): boolean => {
  if (!conversation.lastMessage) return false;

  // If I sent the last message, no unread
  if (conversation.lastMessage.senderId === currentUserId) {
    return false;
  }

  // Otherwise assume unread (frontend will calculate exact count from messages)
  return true;
};

/**
 * Format read receipts for display (for group chats)
 * Shows who has read the message
 */
export const formatReadReceipts = (
  message: Message,
  participants: UserSummary[]
): string => {
  const readBy = participants.filter(
    (p) => message.readBy.includes(p.id) && p.id !== message.sender.id
  );

  if (readBy.length === 0) return '';
  if (readBy.length === 1) return `Seen by ${readBy[0].username}`;
  if (readBy.length === 2)
    return `Seen by ${readBy[0].username} and ${readBy[1].username}`;

  return `Seen by ${readBy[0].username} and ${readBy.length - 1} others`;
};

/**
 * Get conversation display name
 * For direct chats: returns other user's name
 * For group chats: returns group name
 */
export const getConversationName = (
  conversation: Conversation,
  currentUserId: string
): string => {
  if (conversation.type === 'GROUP') {
    return conversation.name || 'Group Chat';
  }

  // Direct chat: show other user's name
  if (!conversation.participants || conversation.participants.length === 0) {
    return 'Unknown User';
  }
  
  const otherUser = conversation.participants.find((p) => p.userId !== currentUserId);
  return otherUser?.username || 'Unknown User';
};

/**
 * Get conversation avatar
 * For direct chats: returns other user's avatar
 * For group chats: returns group avatar
 */
export const getConversationAvatar = (
  conversation: Conversation,
  currentUserId: string
): string | undefined => {
  if (conversation.type === 'GROUP') {
    return conversation.avatar;
  }

  // Direct chat: show other user's avatar
  if (!conversation.participants || conversation.participants.length === 0) {
    return undefined;
  }
  
  const otherUser = conversation.participants.find((p) => p.userId !== currentUserId);
  return otherUser?.avatar;
};

/**
 * Get other user in a direct conversation
 */
export const getOtherUser = (
  conversation: Conversation,
  currentUserId: string
): ConversationMember | undefined => {
  if (conversation.type === 'GROUP') return undefined;
  if (!conversation.participants || conversation.participants.length === 0) return undefined;
  return conversation.participants.find((p) => p.userId !== currentUserId);
};

/**
 * Format timestamp for message display
 */
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Check if two users are in the same conversation
 */
export const areUsersInConversation = (
  conversation: Conversation,
  userIds: string[]
): boolean => {
  if (!conversation.participants || conversation.participants.length === 0) return false;
  return userIds.every((userId) =>
    conversation.participants.some((p) => p.userId === userId)
  );
};

/**
 * Sort conversations by last message timestamp (most recent first)
 */
export const sortConversationsByRecent = (
  conversations: Conversation[]
): Conversation[] => {
  return [...conversations].sort((a, b) => {
    const timeA = a.lastMessage?.timestamp || a.createdAt;
    const timeB = b.lastMessage?.timestamp || b.createdAt;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });
};

export const parsePresetIdFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  // ví dụ url: http://.../api/static/avatars/p7.png -> lấy 'p7'
  const m = url.match(/\/avatars\/(p\d+)\.png$/);
  return m?.[1] ?? null;
};

