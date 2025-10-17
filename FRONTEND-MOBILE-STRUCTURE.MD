frontend-mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── feed.tsx
│   │   ├── explore.tsx
│   │   ├── create.tsx
│   │   ├── messages.tsx
│   │   └── profile.tsx
│   ├── posts/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── users/
│   │   └── [id].tsx
│   ├── messages/
│   │   ├── [conversationId].tsx
│   │   └── new.tsx
│   ├── settings/
│   │   ├── account.tsx
│   │   ├── privacy.tsx
│   │   ├── notifications.tsx
│   │   └── about.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Avatar.tsx
│   │   └── Button.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── OAuthButtons.tsx
│   ├── feed/
│   │   ├── PostCard.tsx
│   │   ├── PostActions.tsx
│   │   ├── CommentSection.tsx
│   │   └── StoryPreview.tsx
│   ├── explore/
│   │   ├── ExploreGrid.tsx
│   │   ├── SearchBar.tsx
│   │   └── CategoryTabs.tsx
│   ├── create/
│   │   ├── ImagePicker.tsx
│   │   ├── VideoRecorder.tsx
│   │   ├── PostEditor.tsx
│   │   └── CameraView.tsx
│   ├── messages/
│   │   ├── ConversationList.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── MessageInput.tsx
│   │   └── ConversationHeader.tsx
│   ├── profile/
│   │   ├── ProfileHeader.tsx
│   │   ├── PostGrid.tsx
│   │   ├── FollowButton.tsx
│   │   ├── FollowersModal.tsx
│   │   └── EditProfileModal.tsx
│   └── notifications/
│       ├── NotificationList.tsx
│       ├── NotificationItem.tsx
│       └── NotificationBadge.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── UserContext.tsx
│   ├── NotificationContext.tsx
│   └── ThemeContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useUser.ts
│   ├── usePost.ts
│   ├── useFetch.ts
│   ├── useImagePicker.ts
│   ├── useCamera.ts
│   └── useNotifications.ts
├── services/
│   ├── authService.ts
│   ├── userService.ts
│   ├── postService.ts
│   ├── commentService.ts
│   ├── messageService.ts
│   ├── likeService.ts
│   ├── followService.ts
│   ├── notificationService.ts
│   └── fileUploadService.ts
├── config/
│   ├── apiConfig.ts
│   ├── constants.ts
│   ├── axiosInstance.ts
│   └── routes.ts
├── types/
│   ├── index.ts
│   ├── auth.ts
│   ├── user.ts
│   ├── post.ts
│   ├── comment.ts
│   ├── message.ts
│   └── notification.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   ├── helpers.ts
│   ├── tokenManager.ts
│   └── imageCompression.ts
├── styles/
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── theme.ts
├── assets/
│   ├── images/
│   ├── icons/
│   └── animations/
├── .env
├── .env.local
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── eas.json
├── .gitignore
└── README.md