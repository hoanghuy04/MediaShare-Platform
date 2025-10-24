instagram-frontend-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── feed.tsx
│   │   ├── explore.tsx
│   │   ├── create.tsx
│   │   ├── messages.tsx
│   │   └── profile.tsx
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── posts/[id].tsx
│   ├── users/[id].tsx
│   ├── messages/[conversationId].tsx
│   ├── _layout.tsx
│   └── index.tsx
│
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── feed/
│   │   ├── PostCard.tsx
│   │   ├── PostActions.tsx
│   │   ├── CommentSection.tsx
│   │   └── FeedList.tsx
│   │
│   ├── explore/
│   │   ├── ExploreGrid.tsx
│   │   ├── SearchBar.tsx
│   │   └── CategoryTabs.tsx
│   │
│   ├── create/
│   │   ├── CreatePostFlow.tsx
│   │   ├── ImagePicker.tsx
│   │   ├── PostEditor.tsx
│   │   └── CaptionInput.tsx
│   │
│   ├── messages/
│   │   ├── ConversationList.tsx
│   │   ├── ChatMessage.tsx
│   │   └── MessageInput.tsx
│   │
│   └── profile/
│       ├── ProfileHeader.tsx
│       ├── PostGrid.tsx
│       └── ProfileStats.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── useFetch.ts
│   ├── useInfiniteScroll.ts
│   ├── useTheme.ts
│   └── useDebounce.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── AppContext.tsx
│
├── services/
│   ├── api.ts
│   ├── storage.ts
│   ├── media.ts
│   └── notifications.ts
│
├── store/
│   ├── auth.ts
│   ├── user.ts
│   ├── feed.ts
│   ├── posts.ts
│   └── notifications.ts
│
├── types/
│   ├── index.ts
│   ├── auth.ts
│   ├── user.ts
│   ├── post.ts
│   ├── message.ts
│   └── api.ts
│
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   ├── helpers.ts
│   └── constants.ts
│
├── styles/
│   ├── theme.ts
│   ├── colors.ts
│   └── tailwind.config.js
│
├── assets/
│   ├── images/
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── adaptive-icon.png
│   ├── icons/
│   └── animations/
│
├── config/
│   ├── apiConfig.ts
│   ├── axiosInstance.ts
│   └── routes.ts
│
├── .env
├── .env.example
├── app.json
├── babel.config.js
├── tsconfig.json
├── tailwind.config.js
├── package.json
├── .eslintrc.json
├── .prettierrc
└── README.md