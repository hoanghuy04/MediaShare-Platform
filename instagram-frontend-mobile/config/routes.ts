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
  USER_STATS: (id: string) => `/api/users/${id}/stats`,
  IS_FOLLOWING: (id: string) => `/api/users/${id}/is-following`,

  // Posts
  POSTS: '/api/posts',
  POST_DETAIL: (id: string) => `/api/posts/${id}`,
  CREATE_POST: '/api/posts',
  UPDATE_POST: (id: string) => `/api/posts/${id}`,
  DELETE_POST: (id: string) => `/api/posts/${id}`,
  LIKE_POST: (id: string) => `/api/posts/${id}/like`,
  UNLIKE_POST: (id: string) => `/api/posts/${id}/unlike`,
  USER_POSTS: (userId: string) => `/api/posts/user/${userId}`,
  FEED: '/api/posts/feed',
  EXPLORE: '/api/posts/explore',

  // Comments (khớp với backend: /comments/*)
  COMMENTS: (postId: string) => `/api/comments/post/${postId}`,
  CREATE_COMMENT: `/api/comments`,
  DELETE_COMMENT: (commentId: string) => `/api/comments/${commentId}`,
  UPDATE_COMMENT: (commentId: string) => `/api/comments/${commentId}`,
  LIKE_COMMENT: (commentId: string) => `/api/comments/${commentId}/like`,
  UNLIKE_COMMENT: (commentId: string) => `/api/comments/${commentId}/like`,

  // Messages
  CONVERSATIONS: '/api/messages',
  CONVERSATION_DETAIL: (id: string) => `/api/messages/${id}`,
  CREATE_CONVERSATION: '/api/messages/conversations',
  MESSAGES: (conversationId: string) => `/api/messages/${conversationId}`,
  SEND_MESSAGE: '/api/messages',
  PIN_CONVERSATION: (id: string) => `/api/messages/conversations/${id}/pin`,
  UNPIN_CONVERSATION: (id: string) => `/api/messages/conversations/${id}/unpin`,
  DELETE_CONVERSATION: (id: string) => `/api/messages/conversations/${id}`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: (id: string) => `/api/notifications/${id}/read`,
  DELETE_NOTIFICATION: (id: string) => `/api/notifications/${id}`,
  UNREAD_COUNT: '/api/notifications/unread-count',

  // Upload
  UPLOAD: '/api/upload',
} as const;
