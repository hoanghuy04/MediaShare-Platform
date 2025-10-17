backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── instagram/
│   │   │           ├── InstagramBackendApplication.java
│   │   │           ├── config/
│   │   │           │   ├── SecurityConfig.java
│   │   │           │   ├── JwtTokenProvider.java
│   │   │           │   ├── MongoDBConfig.java
│   │   │           │   ├── CorsConfig.java
│   │   │           │   └── FileStorageConfig.java
│   │   │           ├── controller/
│   │   │           │   ├── AuthController.java
│   │   │           │   ├── UserController.java
│   │   │           │   ├── PostController.java
│   │   │           │   ├── CommentController.java
│   │   │           │   ├── LikeController.java
│   │   │           │   ├── FollowController.java
│   │   │           │   ├── MessageController.java
│   │   │           │   ├── NotificationController.java
│   │   │           │   └── FileUploadController.java
│   │   │           ├── service/
│   │   │           │   ├── AuthService.java
│   │   │           │   ├── UserService.java
│   │   │           │   ├── PostService.java
│   │   │           │   ├── CommentService.java
│   │   │           │   ├── LikeService.java
│   │   │           │   ├── FollowService.java
│   │   │           │   ├── MessageService.java
│   │   │           │   ├── NotificationService.java
│   │   │           │   ├── FileStorageService.java
│   │   │           │   └── EmailService.java
│   │   │           ├── repository/
│   │   │           │   ├── UserRepository.java
│   │   │           │   ├── PostRepository.java
│   │   │           │   ├── CommentRepository.java
│   │   │           │   ├── LikeRepository.java
│   │   │           │   ├── FollowRepository.java
│   │   │           │   ├── MessageRepository.java
│   │   │           │   └── NotificationRepository.java
│   │   │           ├── entity/
│   │   │           │   ├── User.java
│   │   │           │   ├── Post.java
│   │   │           │   ├── Comment.java
│   │   │           │   ├── Like.java
│   │   │           │   ├── Follow.java
│   │   │           │   ├── Message.java
│   │   │           │   ├── Notification.java
│   │   │           │   └── MediaFile.java
│   │   │           ├── dto/
│   │   │           │   ├── request/
│   │   │           │   │   ├── LoginRequest.java
│   │   │           │   │   ├── RegisterRequest.java
│   │   │           │   │   ├── CreatePostRequest.java
│   │   │           │   │   ├── UpdateUserRequest.java
│   │   │           │   │   ├── CreateCommentRequest.java
│   │   │           │   │   └── SendMessageRequest.java
│   │   │           │   └── response/
│   │   │           │       ├── AuthResponse.java
│   │   │           │       ├── UserResponse.java
│   │   │           │       ├── PostResponse.java
│   │   │           │       ├── CommentResponse.java
│   │   │           │       ├── MessageResponse.java
│   │   │           │       ├── NotificationResponse.java
│   │   │           │       └── ApiResponse.java
│   │   │           ├── exception/
│   │   │           │   ├── GlobalExceptionHandler.java
│   │   │           │   ├── ResourceNotFoundException.java
│   │   │           │   ├── BadRequestException.java
│   │   │           │   ├── UnauthorizedException.java
│   │   │           │   └── ConflictException.java
│   │   │           ├── security/
│   │   │           │   ├── JwtTokenFilter.java
│   │   │           │   ├── CustomUserDetailsService.java
│   │   │           │   └── SecurityUtil.java
│   │   │           ├── util/
│   │   │           │   ├── DateUtil.java
│   │   │           │   ├── ValidationUtil.java
│   │   │           │   └── FileUtil.java
│   │   │           └── enums/
│   │   │               ├── UserRole.java
│   │   │               ├── NotificationType.java
│   │   │               └── MediaType.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       └── logback-spring.xml
│   └── test/
│       ├── java/
│       │   └── com/
│       │       └── instagram/
│       │           ├── controller/
│       │           ├── service/
│       │           └── repository/
│       └── resources/
├── uploads/                          # File storage directory
│   ├── profile-images/
│   ├── posts/
│   └── temp/
├── pom.xml
├── mvnw
├── mvnw.cmd
└── .gitignore