# Instagram Backend API

A comprehensive RESTful API backend for an Instagram-like social media platform built with Spring Boot 3.x and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **User Management**
  - User registration and authentication with JWT
  - Profile management with customizable details
  - User search functionality
  - Public and private account options

- **Posts**
  - Create, read, update, and delete posts
  - Support for multiple images/videos per post
  - Hashtags and tagging functionality
  - Location tagging
  - User feed and explore page

- **Social Interactions**
  - Like/unlike posts and comments
  - Comment on posts with nested replies
  - Follow/unfollow users
  - Real-time notifications

- **Direct Messaging**
  - One-on-one messaging
  - Message status tracking (read/unread)
  - Conversation management

- **File Management**
  - Image and video uploads
  - File type and size validation
  - Support for profile pictures and post media

## 🛠 Tech Stack

- **Framework:** Spring Boot 3.2.0
- **Language:** Java 17+
- **Database:** MongoDB
- **Security:** Spring Security + JWT
- **Validation:** Spring Boot Validation
- **Build Tool:** Maven
- **Code Simplification:** Lombok
- **DTO Mapping:** MapStruct
- **Logging:** SLF4J with Logback
- **Testing:** JUnit 5, Mockito
- **API Documentation:** SpringDoc OpenAPI 3.0 (Swagger UI)

## 📦 Prerequisites

Before running this application, make sure you have the following installed:

- **Java Development Kit (JDK) 17** or higher
- **Maven 3.6+**
- **MongoDB 4.4+** (running on localhost:27017)
- **IDE** (IntelliJ IDEA, Eclipse, or VS Code recommended)

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/instagram-backend.git
   cd instagram-backend
   ```

2. **Install dependencies:**
   ```bash
   mvn clean install
   ```

3. **Configure MongoDB:**
   - Ensure MongoDB is running on `localhost:27017`
   - The application will automatically create the `instagram_db` database

## ⚙️ Configuration

### Application Properties

Configure the application by editing `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/api

# MongoDB Configuration
spring.data.mongodb.uri=mongodb://localhost:27017/instagram_db
spring.data.mongodb.database=instagram_db

# JWT Configuration
jwt.secret=your_secret_key_change_in_production
jwt.expiration=86400000

# File Upload Configuration
file.upload-dir=./uploads
file.max-size=5242880
```

### Environment Variables

For production, set the following environment variables:

- `JWT_SECRET`: Your JWT secret key
- `MONGODB_URI`: MongoDB connection string
- `FILE_UPLOAD_DIR`: Directory for file uploads

## 🏃 Running the Application

### Using Maven

```bash
mvn spring-boot:run
```

### Using JAR

```bash
mvn clean package
java -jar target/instagram-backend-1.0.0.jar
```

### Using IDE

Run the `InstagramApplication.java` main class from your IDE.

The application will start on `http://localhost:8080/api`

## 📚 API Documentation

### Swagger UI

Once the application is running, access the interactive API documentation at:

```
http://localhost:8080/api/swagger-ui.html
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify-token` - Verify token validity

#### Users
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users` - Get all users (paginated)
- `PUT /api/users/{id}` - Update user profile
- `DELETE /api/users/{id}` - Delete user account
- `GET /api/users/{id}/followers` - Get user followers
- `GET /api/users/{id}/following` - Get user following
- `GET /api/users/search` - Search users
- `GET /api/users/{id}/stats` - Get user statistics

#### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts/{id}` - Get post by ID
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/user/{userId}` - Get user's posts
- `GET /api/posts/feed` - Get user's feed
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post
- `GET /api/posts/explore` - Get explore feed

#### Comments
- `POST /api/comments` - Create comment
- `GET /api/comments/{id}` - Get comment by ID
- `GET /api/comments/post/{postId}` - Get post comments
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment
- `POST /api/comments/{id}/replies` - Reply to comment

#### Likes
- `POST /api/posts/{postId}/like` - Like post
- `DELETE /api/posts/{postId}/like` - Unlike post
- `POST /api/comments/{commentId}/like` - Like comment
- `DELETE /api/comments/{commentId}/like` - Unlike comment
- `GET /api/posts/{postId}/likes` - Get post likes

#### Follow
- `POST /api/users/{userId}/follow` - Follow user
- `DELETE /api/users/{userId}/follow` - Unfollow user
- `GET /api/users/{userId}/is-following` - Check if following

#### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/{conversationId}` - Get conversation
- `GET /api/messages` - Get all conversations
- `PUT /api/messages/{id}/read` - Mark message as read
- `DELETE /api/messages/{id}` - Delete message

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `DELETE /api/notifications/{id}` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

#### File Upload
- `POST /api/upload/profile-image` - Upload profile image
- `POST /api/upload/post-media` - Upload post media
- `DELETE /api/upload/files/{fileId}` - Delete file

## 📁 Project Structure

```
instagram-backend/
├── src/
│   ├── main/
│   │   ├── java/com/instagram/
│   │   │   ├── config/              # Configuration classes
│   │   │   ├── controller/          # REST controllers
│   │   │   ├── service/             # Business logic
│   │   │   ├── repository/          # Data access layer
│   │   │   ├── entity/              # MongoDB entities
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   │   ├── request/         # Request DTOs
│   │   │   │   └── response/        # Response DTOs
│   │   │   ├── exception/           # Custom exceptions
│   │   │   ├── security/            # Security components
│   │   │   ├── util/                # Utility classes
│   │   │   ├── enums/               # Enumerations
│   │   │   └── InstagramApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       └── application-prod.properties
│   └── test/                        # Unit and integration tests
├── uploads/                         # File upload directory
├── pom.xml                          # Maven configuration
├── .gitignore
└── README.md
```

## 🧪 Testing

### Run all tests:
```bash
mvn test
```

### Run specific test class:
```bash
mvn test -Dtest=AuthServiceTest
```

### Generate test coverage report:
```bash
mvn clean test jacoco:report
```

The test coverage report will be available at `target/site/jacoco/index.html`

## 🔒 Security

- Passwords are encrypted using BCrypt
- JWT tokens for stateless authentication
- CORS configuration for frontend integration
- Request validation and sanitization
- File upload validation

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Instagram Backend Team

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please contact: support@instagram.com

## 🙏 Acknowledgments

- Spring Boot Documentation
- MongoDB Documentation
- JWT.io
- Swagger/OpenAPI

---

**Happy Coding! 🎉**

