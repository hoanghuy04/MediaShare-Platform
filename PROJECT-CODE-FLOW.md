# 📐 PROJECT CODE FLOW - MediaShare Platform

**Project:** Instagram Clone - Social Media Platform  
**Tech Stack:** Spring Boot (Backend) + React Native Expo (Frontend)  
**Date:** 2025-10-18

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │   Feed   │  │  Profile │  │ Messages │   │
│  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │          │
│  ┌────▼─────────────▼──────────────▼──────────────▼─────┐  │
│  │         API Service Layer (services/api.ts)          │  │
│  └────┬──────────────────────────────────────────────────┘  │
│       │                                                      │
│  ┌────▼──────────────────────────────────────────────────┐  │
│  │     Axios Instance (config/axiosInstance.ts)         │  │
│  │  • JWT Token Injection                                │  │
│  │  • Auto userId/senderId Parameter Injection          │  │
│  │  • Error Handling                                     │  │
│  └────┬──────────────────────────────────────────────────┘  │
└───────┼──────────────────────────────────────────────────────┘
        │
        │ HTTP/HTTPS
        │
┌───────▼──────────────────────────────────────────────────────┐
│                   Spring Boot Backend                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         SecurityConfig (JWT Filter)                   │   │
│  └────┬──────────────────────────────────────────────────┘   │
│       │                                                       │
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │                   Controllers                          │   │
│  │  • AuthController    • PostController                 │   │
│  │  • UserController    • CommentController              │   │
│  │  • MessageController • NotificationController         │   │
│  └────┬──────────────────────────────────────────────────┘   │
│       │                                                       │
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │                   Service Layer                        │   │
│  │  • AuthService       • PostService                    │   │
│  │  • UserService       • CommentService                 │   │
│  │  • MessageService    • NotificationService            │   │
│  └────┬──────────────────────────────────────────────────┘   │
│       │                                                       │
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │             Repository Layer (MongoDB)                 │   │
│  │  • UserRepository    • PostRepository                 │   │
│  │  • MessageRepository • NotificationRepository         │   │
│  └────┬──────────────────────────────────────────────────┘   │
└───────┼───────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────────────────────────────┐
│                       MongoDB Database                         │
│  Collections: users, posts, comments, messages,               │
│               notifications, follows                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

### 1. User Registration Flow

```
User Input (Register Screen)
      │
      ├─ username, email, password, firstName, lastName
      │
      ▼
AuthContext.register()
      │
      ├─ Call authAPI.register(data)
      │
      ▼
Axios POST /api/auth/register
      │
      ├─ Send RegisterRequest DTO
      │
      ▼
Backend: AuthController.register()
      │
      ├─ Validate input
      ├─ Check if username/email exists
      ├─ Hash password (BCrypt)
      ├─ Create User entity
      ├─ Save to MongoDB
      ├─ Generate JWT tokens (access + refresh)
      │
      ▼
Return ApiResponse<AuthResponse>
      │
      ├─ accessToken: String
      ├─ refreshToken: String
      ├─ tokenType: "Bearer"
      └─ user: UserResponse
      │
      ▼
Frontend: Store tokens & user data
      │
      ├─ SecureStore.setItem('authToken', accessToken)
      ├─ AsyncStorage.setItem('userData', JSON.stringify(user))
      ├─ Set user state in AuthContext
      │
      ▼
Navigate to Feed Screen (/(tabs)/feed)
```

### 2. User Login Flow

```
User Input (Login Screen)
      │
      ├─ usernameOrEmail, password
      │
      ▼
AuthContext.login()
      │
      ├─ Call authAPI.login(credentials)
      │
      ▼
Axios POST /api/auth/login
      │
      ├─ Send LoginRequest DTO
      │
      ▼
Backend: AuthController.login()
      │
      ├─ Validate credentials
      ├─ Load user from DB
      ├─ Verify password (BCrypt)
      ├─ Generate JWT tokens
      │
      ▼
Return ApiResponse<AuthResponse>
      │
      ├─ accessToken, refreshToken, user
      │
      ▼
Frontend: Store & Navigate
      │
      ├─ Store tokens in SecureStore
      ├─ Store user in AsyncStorage
      ├─ Set AuthContext state
      │
      ▼
router.replace('/(tabs)/feed')
```

### 3. Token Refresh Flow

```
API Request with Expired Token
      │
      ▼
Backend Returns 401 Unauthorized
      │
      ▼
Axios Interceptor Catches Error
      │
      ├─ Get refreshToken from SecureStore
      │
      ▼
POST /api/auth/refresh-token
      │
      ├─ Send { refreshToken }
      │
      ▼
Backend: AuthController.refreshToken()
      │
      ├─ Validate refresh token
      ├─ Generate new access token
      │
      ▼
Return new AuthResponse
      │
      ├─ Store new accessToken
      ├─ Retry original request
      │
      ▼
Return original response to caller
```

---

## 📱 FRONTEND DATA FLOW

### Component → API → State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Screen Component                        │
│                   (e.g., FeedScreen)                         │
└────┬────────────────────────────────────────────────────┬───┘
     │                                                      │
     │ useInfiniteScroll Hook                              │ Direct API Call
     │                                                      │
┌────▼────────────────────────────────────────────────────▼───┐
│                  services/api.ts                             │
│  • authAPI, postAPI, userAPI, commentAPI, etc.              │
└────┬─────────────────────────────────────────────────────────┘
     │
┌────▼─────────────────────────────────────────────────────────┐
│              config/axiosInstance.ts                          │
│  Request Interceptor:                                         │
│  1. Add Authorization: Bearer <token>                         │
│  2. Auto-inject userId/senderId/followerId                    │
│                                                               │
│  Response Interceptor:                                        │
│  1. Extract response.data.data (unwrap ApiResponse)          │
│  2. Handle 401 → refresh token                               │
│  3. Handle errors → show error message                       │
└────┬──────────────────────────────────────────────────────────┘
     │
     ▼
Backend API
     │
     ▼
Response
     │
┌────▼──────────────────────────────────────────────────────────┐
│                    Component State                             │
│  • useState for local state                                    │
│  • useInfiniteScroll for paginated lists                      │
│  • AuthContext for global auth state                          │
│  • Re-render UI with new data                                 │
└────────────────────────────────────────────────────────────────┘
```

### Example: Feed List Flow

```typescript
// 1. Screen initializes
FeedScreen.tsx
  ├─ useInfiniteScroll({ fetchFunc: postAPI.getFeed })
  │
  ▼

// 2. Hook calls API
useInfiniteScroll.ts
  ├─ loadData(page: 1, limit: 20)
  ├─ setIsLoading(true)
  ├─ await postAPI.getFeed(1, 20)
  │
  ▼

// 3. API service
services/api.ts: postAPI.getFeed()
  ├─ axiosInstance.get('/api/posts/feed', { params: { page, limit } })
  │
  ▼

// 4. Axios interceptor
config/axiosInstance.ts
  ├─ Add header: Authorization: Bearer <token>
  ├─ Add params: userId (auto-injected from storage)
  │
  ▼

// 5. Backend processes
PostController.getFeed(userId, Pageable)
  ├─ PostService.getFeed(userId, page)
  ├─ Get posts from following users
  ├─ Return Page<PostResponse>
  │
  ▼

// 6. Response unwrapping
Axios response interceptor
  ├─ response.data = { success: true, data: Page<Post>, message: "..." }
  ├─ Return response.data.data (unwrap)
  │
  ▼

// 7. Update state
useInfiniteScroll.ts
  ├─ setData(response.data) // Array of posts
  ├─ setHasMore(response.hasMore)
  ├─ setIsLoading(false)
  │
  ▼

// 8. UI updates
FeedList.tsx
  ├─ FlatList renders posts array
  ├─ Each item renders PostCard component
  └─ Shows LoadingSpinner if isLoading
```

---

## 🔄 BACKEND REQUEST PROCESSING FLOW

### Complete Request Lifecycle

```
HTTP Request arrives
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Security Filter Chain                    │
│                                                             │
│  JwtAuthenticationFilter:                                   │
│  1. Extract JWT from Authorization header                   │
│  2. Validate token (signature, expiration)                  │
│  3. Extract username from token                             │
│  4. Load UserDetails from UserService                       │
│  5. Set SecurityContextHolder.setAuthentication()           │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                        Controller                           │
│                                                             │
│  @PostMapping("/api/posts")                                 │
│  public ResponseEntity<ApiResponse<PostResponse>> create(   │
│      @Valid @RequestBody CreatePostRequest request,         │
│      @RequestParam String userId                            │
│  )                                                          │
│                                                             │
│  • Validate request body (@Valid)                           │
│  • Extract parameters                                       │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│                                                             │
│  PostService.createPost(request, userId):                   │
│  1. Validate user exists                                    │
│  2. Validate media files                                    │
│  3. Create Post entity                                      │
│  4. Set relationships (author, media, tags)                 │
│  5. Call repository.save()                                  │
│  6. Create notifications for followers                      │
│  7. Convert entity to DTO                                   │
│  8. Return PostResponse                                     │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                         │
│                                                             │
│  @Repository                                                │
│  interface PostRepository extends MongoRepository<Post>     │
│                                                             │
│  • MongoDB operations (save, find, delete)                  │
│  • Custom queries (@Query)                                  │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                       │
│                                                             │
│  • Save/Update document                                     │
│  • Return saved entity                                      │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
Response bubbles back up
     │
     ▼
Controller wraps in ApiResponse
     │
     ├─ ApiResponse.success("Post created", postResponse)
     ├─ ResponseEntity.status(201).body(apiResponse)
     │
     ▼
Return to client
```

---

## 📊 KEY FEATURE FLOWS

### 1. Create Post Flow

```
Frontend Flow:
─────────────
CreatePostFlow.tsx
  │
  ├─ 1. User selects images/videos (ImagePicker)
  ├─ 2. User crops/edits media (PostEditor)
  ├─ 3. User adds caption (CaptionInput)
  │
  ▼
Upload media files
  │
  ├─ uploadAPI.uploadMultipleFiles(formData)
  ├─ POST /api/upload/post-media/batch?userId=xxx
  │
  ▼
Backend stores files → Returns file paths
  │
  ▼
Create post with media URLs
  │
  ├─ postAPI.createPost({
  │     caption,
  │     mediaUrls: [path1, path2],
  │     tags: ['travel', 'food']
  │   })
  ├─ POST /api/posts?userId=xxx
  │
  ▼
Backend Flow:
─────────────
PostController.createPost()
  │
  ├─ Validate request
  ├─ Create Post entity
  ├─ Convert media URLs to Media objects
  ├─ Save to MongoDB
  ├─ Create notifications for followers
  │
  ▼
Return PostResponse
  │
  ▼
Frontend redirects to post detail or profile
```

### 2. Like/Unlike Post Flow

```
User taps ❤️ button
  │
  ▼
PostActions.tsx → onLike()
  │
  ▼
FeedScreen.handleLike(postId)
  │
  ▼
postAPI.likePost(postId)
  │
  ├─ POST /api/posts/{postId}/like?userId=xxx
  │
  ▼
Backend:
────────
LikeController.likePost(postId, userId)
  │
  ├─ Check if already liked
  ├─ If not: Create Like entity
  ├─ Increment post.likesCount
  ├─ Create notification for post author
  ├─ Save to DB
  │
  ▼
Return ApiResponse<Void>
  │
  ▼
Frontend:
─────────
  │
  ├─ Update local state (optimistic update)
  ├─ post.isLikedByCurrentUser = true
  ├─ post.likesCount += 1
  ├─ Re-render ❤️ → ❤️ (red)
  │
  ▼
Done
```

### 3. Comment Flow

```
User types comment → Taps Send
  │
  ▼
CommentSection.tsx
  │
  ├─ onSubmit(text)
  │
  ▼
commentAPI.createComment({
  postId: 'xxx',
  text: 'Nice photo!'
})
  │
  ├─ POST /api/comments?userId=xxx
  │
  ▼
Backend:
────────
CommentController.createComment(request, userId)
  │
  ├─ Validate post exists
  ├─ Create Comment entity
  ├─ Set author (userId)
  ├─ Increment post.commentsCount
  ├─ Create notification for post author
  ├─ Save to DB
  │
  ▼
Return ApiResponse<CommentResponse>
  │
  ▼
Frontend:
─────────
  │
  ├─ Add new comment to list
  ├─ Update post.commentsCount
  ├─ Clear input field
  ├─ Show comment in UI
  │
  ▼
Done
```

### 4. Follow/Unfollow User Flow

```
User taps "Follow" button
  │
  ▼
ProfileHeader.tsx → onFollow()
  │
  ▼
userAPI.followUser(userId)
  │
  ├─ POST /api/users/{userId}/follow?followerId=xxx
  │
  ▼
Backend:
────────
FollowController.followUser(userId, followerId)
  │
  ├─ Check if already following
  ├─ Create Follow entity
  ├─ Increment user.followersCount
  ├─ Increment follower.followingCount
  ├─ Create notification for followed user
  ├─ Save to DB
  │
  ▼
Return ApiResponse<Void>
  │
  ▼
Frontend:
─────────
  │
  ├─ Update local state
  ├─ profile.isFollowing = true
  ├─ profile.followersCount += 1
  ├─ Button text: "Follow" → "Following"
  ├─ Button color: blue → gray
  │
  ▼
Done
```

### 5. Real-time Messaging Flow

```
User types message → Taps Send
  │
  ▼
MessageInput.tsx → onSend(content)
  │
  ▼
messageAPI.sendMessage({
  receiverId: 'xxx',
  content: 'Hello!'
})
  │
  ├─ POST /api/messages?senderId=xxx
  │
  ▼
Backend:
────────
MessageController.sendMessage(request, senderId)
  │
  ├─ Validate receiver exists
  ├─ Find or create Conversation
  ├─ Create Message entity
  ├─ Update conversation.lastMessage
  ├─ Increment receiver.unreadCount
  ├─ Save to DB
  ├─ Send WebSocket notification (optional)
  │
  ▼
Return ApiResponse<MessageResponse>
  │
  ▼
Frontend:
─────────
  │
  ├─ Add message to conversation
  ├─ Scroll to bottom
  ├─ Clear input
  ├─ Update conversation.lastMessage in list
  │
  ▼
Receiver's app:
───────────────
  │
  ├─ WebSocket receives notification
  ├─ Show notification badge
  ├─ If on messages screen: fetch new messages
  │
  ▼
Done
```

### 6. Infinite Scroll Feed Flow

```
User scrolls to bottom of feed
  │
  ▼
FlatList.onEndReached()
  │
  ▼
useInfiniteScroll.loadMore()
  │
  ├─ Check: !isLoading && hasMore
  ├─ Set isLoadingMore = true
  ├─ Increment page
  │
  ▼
postAPI.getFeed(page + 1, limit)
  │
  ├─ GET /api/posts/feed?page=2&limit=20&userId=xxx
  │
  ▼
Backend:
────────
PostController.getFeed(userId, Pageable)
  │
  ├─ Get user's following list
  ├─ Find posts from following users
  ├─ Sort by createdAt DESC
  ├─ Apply pagination (page 2, size 20)
  ├─ Return Page<PostResponse>
  │     └─ data: [...20 posts]
  │     └─ hasMore: true/false
  │
  ▼
Frontend:
─────────
  │
  ├─ Append new posts to existing array
  ├─ data = [...prevData, ...newData]
  ├─ Update hasMore flag
  ├─ Set isLoadingMore = false
  ├─ FlatList re-renders with more items
  │
  ▼
User sees more posts, continues scrolling
```

---

## 🔧 AXIOS INTERCEPTOR FLOW

### Request Interceptor (Auto Parameter Injection)

```typescript
// Every API request goes through this:

Request Initiated
  │
  ▼
Axios Request Interceptor
  │
  ├─ 1. Get authToken from SecureStore
  ├─ 2. Add header: Authorization: Bearer <token>
  │
  ├─ 3. Get userData from AsyncStorage
  ├─ 4. Extract userId
  │
  ├─ 5. Determine endpoint type:
  │    │
  │    ├─ If /posts/* → add ?userId=xxx
  │    ├─ If /comments/* → add ?userId=xxx
  │    ├─ If /upload/* → add ?userId=xxx
  │    ├─ If /notifications/* → add ?userId=xxx
  │    ├─ If /messages/* (GET) → add ?userId=xxx
  │    ├─ If /messages/* (POST) → add ?senderId=xxx
  │    └─ If /follow/* → add ?followerId=xxx
  │
  ▼
Modified Request Sent to Backend
```

### Response Interceptor (Error Handling)

```typescript
Response Received
  │
  ▼
Axios Response Interceptor
  │
  ├─ Success (2xx)?
  │   │
  │   ├─ Extract response.data.data (unwrap ApiResponse)
  │   └─ Return data
  │
  ├─ 401 Unauthorized?
  │   │
  │   ├─ Get refreshToken
  │   ├─ Call /auth/refresh-token
  │   ├─ Store new accessToken
  │   └─ Retry original request
  │
  ├─ 403 Forbidden?
  │   │
  │   └─ Redirect to login
  │
  └─ Other errors (4xx, 5xx)?
      │
      ├─ Extract error message
      ├─ Show alert to user
      └─ Throw error
```

---

## 📦 DATA MODELS

### Frontend Types

```typescript
// types/auth.ts
interface User {
  id: string;
  username: string;
  email: string;
  profile?: ProfileData;
  roles?: string[];
  followersCount?: number;
  followingCount?: number;
  isPrivate?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// types/post.ts
interface Post {
  id: string;
  author: UserProfile;
  caption: string;
  media: Media[];
  likesCount: number;
  commentsCount: number;
  tags?: string[];
  location?: string;
  isLikedByCurrentUser?: boolean;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

// types/message.ts
interface Conversation {
  id: string;
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt?: string;
}
```

### Backend Entities

```java
// entity/User.java
@Document(collection = "users")
public class User {
    @Id private String id;
    private String username;
    private String email;
    private String password;
    private Profile profile;
    private Set<String> roles;
    private Integer followersCount;
    private Integer followingCount;
    private Boolean isPrivate;
    private Boolean isVerified;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

// entity/Post.java
@Document(collection = "posts")
public class Post {
    @Id private String id;
    @DBRef private User author;
    private String caption;
    private List<Media> media;
    private Integer likesCount;
    private Integer commentsCount;
    private List<String> tags;
    private String location;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### API Response Wrapper

```java
// dto/response/ApiResponse.java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
```

---

## 🔍 ERROR HANDLING FLOW

### Frontend Error Handling

```
API Call Fails
  │
  ▼
Axios catches error
  │
  ├─ Check error.response.status
  │
  ├─ 401 → Attempt token refresh
  ├─ 403 → Redirect to login
  ├─ 404 → Show "Not found"
  ├─ 500 → Show "Server error"
  │
  ▼
Show error to user
  │
  ├─ showAlert('Error', message)
  │     OR
  ├─ Toast.show({ type: 'error', text: message })
  │
  ▼
Log error (optional)
  │
  └─ console.error('API Error:', error)
```

### Backend Error Handling

```
Exception Thrown
  │
  ▼
@ControllerAdvice catches
  │
  ├─ ResourceNotFoundException → 404
  ├─ ValidationException → 400
  ├─ UnauthorizedException → 401
  ├─ ForbiddenException → 403
  ├─ Exception → 500
  │
  ▼
Format as ApiResponse
  │
  └─ ApiResponse.error(message)
  │
  ▼
Return to client with appropriate status code
```

---

## 🚀 APP INITIALIZATION FLOW

```
App Starts
  │
  ▼
_layout.tsx (Root Layout)
  │
  ├─ Wrap with AuthProvider
  │
  ▼
AuthContext initialization
  │
  ├─ useState: user, isLoading
  ├─ useEffect: loadUser()
  │
  ▼
loadUser() executes
  │
  ├─ Get token from SecureStore
  ├─ If token exists:
  │   │
  │   ├─ Get userData from AsyncStorage
  │   ├─ If userData: setUser(userData)
  │   └─ If no userData: clearToken()
  │
  ├─ If no token: Stay on auth screen
  │
  └─ setIsLoading(false)
  │
  ▼
Navigation decision
  │
  ├─ user exists?
  │   └─ Show /(tabs)/* screens
  │
  └─ user null?
      └─ Show /(auth)/* screens
  │
  ▼
App Ready
```

---

## 📊 STATE MANAGEMENT

### Global State (Context)

```
AuthContext
  │
  ├─ user: User | null
  ├─ isLoading: boolean
  ├─ login(credentials)
  ├─ register(data)
  ├─ logout()
  └─ loadUser()

ThemeContext
  │
  ├─ theme: Theme
  ├─ isDark: boolean
  └─ toggleTheme()
```

### Local State (Hooks)

```
useInfiniteScroll
  │
  ├─ data: T[]
  ├─ page: number
  ├─ hasMore: boolean
  ├─ isLoading: boolean
  ├─ isLoadingMore: boolean
  ├─ loadMore()
  ├─ refresh()
  └─ reset()

useDebounce
  │
  └─ Returns debounced value after delay
```

---

## 🔄 REAL-TIME UPDATES (WebSocket - Optional)

```
Backend: WebSocket Configuration
─────────────────────────────────
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig {
    // Configure STOMP endpoint: /ws
    // Enable message broker: /topic, /queue
}

Message Flow:
─────────────
User A sends message
  │
  ▼
Backend saves message
  │
  ├─ Save to MongoDB
  │
  ▼
Broadcast via WebSocket
  │
  ├─ messagingTemplate.convertAndSend(
  │     "/topic/messages/{receiverId}",
  │     messageResponse
  │   )
  │
  ▼
User B receives notification
  │
  ├─ WebSocket client listens on /topic/messages/{userId}
  ├─ Receive message event
  ├─ Update UI (add to conversation)
  └─ Show notification badge
```

---

## 📝 SUMMARY

### Request Flow Summary

1. **User Action** → Screen component
2. **API Call** → services/api.ts
3. **Interceptor** → Add auth token + auto params
4. **Backend** → Security filter → Controller → Service → Repository
5. **Database** → MongoDB operations
6. **Response** → Wrapped in ApiResponse
7. **Interceptor** → Unwrap data, handle errors
8. **State Update** → Re-render UI

### Key Patterns

- ✅ **JWT Authentication** - Token-based auth with refresh mechanism
- ✅ **API Response Wrapper** - Consistent `ApiResponse<T>` structure
- ✅ **Axios Interceptors** - Auto token & parameter injection
- ✅ **Context + Hooks** - Global auth state + reusable data fetching
- ✅ **Infinite Scroll** - Pagination with `useInfiniteScroll` hook
- ✅ **Type Safety** - TypeScript interfaces match backend DTOs
- ✅ **Error Handling** - Graceful error handling at all layers
- ✅ **Separation of Concerns** - Controller → Service → Repository

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-18  
**Status:** ✅ Complete
