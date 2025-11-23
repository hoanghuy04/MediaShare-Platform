export const AUTH_ROUTES = {
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  FORGOT_PASSWORD: '/(auth)/forgot-password',
} as const;

export const TAB_ROUTES = {
  FEED: '/(tabs)/feed',
  EXPLORE: '/(tabs)/explore',
  CREATE: '/(tabs)/create',
  MESSAGES: '/(tabs)/messages',
  PROFILE: '/(tabs)/profile',
} as const;

export const APP_ROUTES = {
  POST_DETAIL: (id: string) => `/posts/${id}`,
  USER_PROFILE: (id: string) => `/users/${id}`,
  CONVERSATION: (id: string) => `/messages/${id}`,
} as const;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  VERIFY_TOKEN: '/api/auth/verify-token',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',

  // Users
  USERS: '/api/users',
  USER_PROFILE: (id: string) => `/api/users/${id}`,
  UPDATE_PROFILE: (id: string) => `/api/users/${id}`, // Khớp với backend
  DELETE_USER: (id: string) => `/api/users/${id}`,
  FOLLOW: (id: string) => `/api/users/${id}/follow`,
  UNFOLLOW: (id: string) => `/api/users/${id}/follow`, // DELETE method
  FOLLOWERS: (id: string) => `/api/users/${id}/followers`,
  FOLLOWING: (id: string) => `/api/users/${id}/following`,
  FOLLOWING_SUMMARY: (id: string) => `/api/users/${id}/following-summary`,
  MUTUAL_FOLLOWS: (id: string) => `/api/users/${id}/mutual-follows`,
  USER_STATS: (id: string) => `/api/users/${id}/stats`,
  IS_FOLLOWING: (id: string) => `/api/users/${id}/is-following`,

  // Posts
  POSTS: '/api/posts',
  POST_DETAIL: (id: string) => `/api/posts/${id}`,
  CREATE_POST: '/api/posts',
  UPDATE_POST: (id: string) => `/api/posts/${id}`,
  DELETE_POST: (id: string) => `/api/posts/${id}`,
  TOGGLE_LIKE_POST: (id: string) => `api/posts/${id}/like`,
  POST_LIKES: (id: string) => `/api/posts/${id}/likes`,
  USER_POSTS: (userId: string) => `/api/posts/user/${userId}`,
  FEED: '/api/posts/feed',
  EXPLORE: '/api/posts/explore',
  REELS: '/api/posts/reels',
  GET_POST_LIKES: (id: string) => `api/posts/${id}/likes`,

  // Comments
  GET_COMMENTS: (postId: string) => `/api/posts/${postId}/comments`,
  CREATE_COMMENT: (postId: string) => `/api/posts/${postId}/comments`,
  GET_REPLIES: (postId: string, commentId: string) => `/api/posts/${postId}/comments/${commentId}/replies`,
  TOGGLE_LIKE_COMMENT: (postId: string, commentId: string) => `/api/posts/${postId}/comments/${commentId}/like`,
  DELETE_COMMENT: (postId: string, commentId: string) => `/api/posts/${postId}/comments/${commentId}`,
  UPDATE_COMMENT: (commentId: string) => `/api/comments/${commentId}`,
  REPLY_TO_COMMENT: (commentId: string) => `/api/comments/${commentId}/replies`,

  // Messages / Conversations
  INBOX: '/api/conversations/inbox',
  CONVERSATION_DETAIL: (id: string) => `/api/conversations/${id}`,
  CONVERSATION_MESSAGES: (id: string) => `/api/conversations/${id}/messages`,
  UPDATE_CONVERSATION: (conversationId: string) => `/api/conversations/${conversationId}`,
  SEND_DIRECT_MESSAGE: '/api/conversations/direct/messages',
  SEND_MESSAGE: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
  MARK_MESSAGE_READ: (messageId: string) => `/api/conversations/messages/${messageId}/read`,
  DELETE_MESSAGE: (messageId: string) => `/api/conversations/messages/${messageId}`,
  DELETE_CONVERSATION: (conversationId: string) => `/api/conversations/${conversationId}`,

  // Group Chat
  CREATE_GROUP: '/api/conversations/group',
  UPDATE_GROUP: (id: string) => `/api/conversations/${id}`,
  ADD_MEMBERS: (id: string) => `/api/conversations/${id}/members`,
  REMOVE_MEMBER: (id: string, userId: string) => `/api/conversations/${id}/members/${userId}`,
  PROMOTE_ADMIN: (conversationId: string, userId: string) => `/api/conversations/${conversationId}/members/${userId}/promote`,
  DEMOTE_ADMIN: (conversationId: string, userId: string) => `/api/conversations/${conversationId}/members/${userId}/demote`,
  LEAVE_GROUP: (id: string) => `/api/conversations/${id}/leave`,

  // Message Requests
  MESSAGE_REQUESTS: '/api/message-requests',
  MESSAGE_REQUESTS_COUNT: '/api/message-requests/count',
  MESSAGE_REQUESTS_INBOX: '/api/message-requests/inbox',
  MESSAGE_REQUESTS_PENDING_MESSAGES: '/api/message-requests/pending-messages',
  MESSAGE_REQUESTS_PENDING_MESSAGES_BY_ID: (requestId: string) => `/api/message-requests/${requestId}/pending-messages`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: (id: string) => `/api/notifications/${id}/read`,
  DELETE_NOTIFICATION: (id: string) => `/api/notifications/${id}`,
  UNREAD_COUNT: '/api/notifications/unread-count',

  // Upload
  UPLOAD: '/api/files',
  UPLOAD_PROFILE_IMAGE: '/api/files/upload/profile-image',
  UPLOAD_POST_MEDIA: '/api/files/upload/post-media',
  UPLOAD_POST_MEDIA_BATCH: '/api/files/upload/post-media/batch',
  DELETE_FILE: (fileId: string) => `/api/files/upload/${fileId}`,

  // AI Chat
  AI_CHAT: '/api/ai/chat',
  AI_CONVERSATION: '/api/ai/conversation',
  AI_CLEAR_HISTORY: '/api/ai/conversation/history',
} as const;
