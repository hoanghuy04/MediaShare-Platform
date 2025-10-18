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
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  ME: '/api/auth/me',

  // Users
  USERS: '/api/users',
  USER_PROFILE: (id: string) => `/api/users/${id}`,
  UPDATE_PROFILE: '/api/users/profile',
  FOLLOW: (id: string) => `/api/users/${id}/follow`,
  UNFOLLOW: (id: string) => `/api/users/${id}/unfollow`,
  FOLLOWERS: (id: string) => `/api/users/${id}/followers`,
  FOLLOWING: (id: string) => `/api/users/${id}/following`,

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

  // Comments
  COMMENTS: (postId: string) => `/api/posts/${postId}/comments`,
  CREATE_COMMENT: (postId: string) => `/api/posts/${postId}/comments`,
  DELETE_COMMENT: (postId: string, commentId: string) =>
    `/api/posts/${postId}/comments/${commentId}`,
  LIKE_COMMENT: (postId: string, commentId: string) =>
    `/api/posts/${postId}/comments/${commentId}/like`,

  // Messages
  CONVERSATIONS: '/api/messages/conversations',
  CONVERSATION_DETAIL: (id: string) => `/api/messages/conversations/${id}`,
  CREATE_CONVERSATION: '/api/messages/conversations',
  MESSAGES: (conversationId: string) => `/api/messages/conversations/${conversationId}/messages`,
  SEND_MESSAGE: (conversationId: string) =>
    `/api/messages/conversations/${conversationId}/messages`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: (id: string) => `/api/notifications/${id}/read`,
  MARK_ALL_READ: '/api/notifications/read-all',

  // Upload
  UPLOAD: '/api/upload',
  UPLOAD_PROFILE_IMAGE: '/api/upload/profile',
  UPLOAD_COVER_IMAGE: '/api/upload/cover',
  UPLOAD_POST_MEDIA: '/api/upload/post',
} as const;

