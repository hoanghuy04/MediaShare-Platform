frontend-admin/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   ├── config/
│   │   ├── apiConfig.ts
│   │   ├── constants.ts
│   │   └── axiosInstance.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── UserContext.tsx
│   │   └── NotificationContext.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── user/
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserList.tsx
│   │   │   ├── UserEdit.tsx
│   │   │   └── UserCard.tsx
│   │   ├── post/
│   │   │   ├── PostList.tsx
│   │   │   ├── PostDetail.tsx
│   │   │   ├── PostCreate.tsx
│   │   │   ├── PostEdit.tsx
│   │   │   └── PostCard.tsx
│   │   ├── comment/
│   │   │   ├── CommentList.tsx
│   │   │   └── CommentItem.tsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StatisticsCard.tsx
│   │   │   ├── Charts.tsx
│   │   │   └── ActivityFeed.tsx
│   │   ├── message/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageDetail.tsx
│   │   │   └── MessageItem.tsx
│   │   └── moderation/
│   │       ├── ReportedContent.tsx
│   │       ├── UserBans.tsx
│   │       └── ContentReview.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── PostsPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── usePost.ts
│   │   ├── useApi.ts
│   │   └── useFetch.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── postService.ts
│   │   ├── commentService.ts
│   │   ├── messageService.ts
│   │   ├── notificationService.ts
│   │   └── fileUploadService.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── post.ts
│   │   ├── comment.ts
│   │   ├── message.ts
│   │   └── notification.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── helpers.ts
│   │   └── tokenManager.ts
│   ├── styles/
│   │   ├── index.css
│   │   ├── variables.css
│   │   ├── responsive.css
│   │   └── animations.css
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
├── .env
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md