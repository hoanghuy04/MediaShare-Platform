# AI Chat Feature - Quick Start Guide

## 🎯 Overview

AI Chat feature cho phép users chat với AI assistant sử dụng OpenAI GPT. Conversation history được lưu trữ trong MongoDB và broadcast qua WebSocket real-time.

---

## 📋 Prerequisites

### 1. OpenAI API Key
Đăng ký tại [OpenAI Platform](https://platform.openai.com/) và lấy API key.

### 2. Environment Variables
Thêm vào `application.properties` hoặc environment:

```properties
# OpenAI Configuration
spring.ai.openai.api-key=YOUR_OPENAI_API_KEY_HERE
spring.ai.openai.chat.options.model=gpt-4
spring.ai.openai.chat.options.temperature=0.7

# Hoặc sử dụng environment variable
# SPRING_AI_OPENAI_API_KEY=your-key-here
```

### 3. MongoDB Running
```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc local MongoDB
mongod --dbpath /path/to/data
```

---

## 🚀 API Endpoints

### Base URL: `/api/v1/ai`

### 1. **Send Message to AI**

**Endpoint:** `POST /api/v1/ai/chat`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "What is machine learning?"
}
```

**Response (201 Created):**
```json
{
  "code": 200,
  "message": "AI responded successfully",
  "data": {
    "id": "673f8a2b1234567890abcdef",
    "conversationId": "673f8a2b0987654321fedcba",
    "sender": {
      "id": "ai-user-id",
      "username": "ai-assistant",
      "avatar": null
    },
    "content": "Machine learning is a subset of artificial intelligence...",
    "mediaUrl": null,
    "readBy": [],
    "replyToMessageId": null,
    "createdAt": "2025-11-21T10:30:45.123Z"
  }
}
```

---

### 2. **Get AI Conversation**

**Endpoint:** `GET /api/v1/ai/conversation`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "AI conversation retrieved",
  "data": {
    "id": "673f8a2b0987654321fedcba",
    "type": "DIRECT",
    "name": null,
    "avatar": null,
    "participants": [
      {
        "userId": "user-123",
        "username": "john_doe",
        "avatar": "https://..."
      },
      {
        "userId": "ai-user-id",
        "username": "ai-assistant",
        "avatar": null
      }
    ],
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:30:45.123Z"
  }
}
```

---

### 3. **Clear Conversation History**

**Endpoint:** `DELETE /api/v1/ai/conversation/history`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "Conversation history cleared",
  "data": null
}
```

---

### 4. **Admin: Send Message for User** (Testing/Admin Only)

**Endpoint:** `POST /api/v1/ai/chat/{userId}`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Test message for user"
}
```

---

## 💻 Frontend Integration

### JavaScript/TypeScript Example

```typescript
// API Service
class AiChatService {
  private baseUrl = 'http://localhost:8080/api/v1/ai';
  private token = localStorage.getItem('jwt_token');

  // Send message to AI
  async sendMessage(content: string): Promise<MessageResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    const result = await response.json();
    return result.data;
  }

  // Get conversation
  async getConversation(): Promise<ConversationResponse> {
    const response = await fetch(`${this.baseUrl}/conversation`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    const result = await response.json();
    return result.data;
  }

  // Clear history
  async clearHistory(): Promise<void> {
    await fetch(`${this.baseUrl}/conversation/history`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
  }
}

// Usage Example
const aiService = new AiChatService();

// Send message
const response = await aiService.sendMessage("Hello AI!");
console.log('AI Response:', response.content);

// Get conversation
const conversation = await aiService.getConversation();
console.log('Conversation ID:', conversation.id);

// Clear history
await aiService.clearHistory();
console.log('History cleared');
```

---

### WebSocket Integration

```typescript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
  private stompClient: any;
  
  connect(token: string, userId: string) {
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);
    
    this.stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        // Subscribe to user's messages
        this.stompClient.subscribe(
          `/user/${userId}/queue/messages`,
          (message: any) => {
            const aiMessage = JSON.parse(message.body);
            console.log('New AI message:', aiMessage);
            // Update UI with new message
            this.displayMessage(aiMessage);
          }
        );
      }
    );
  }
  
  displayMessage(message: any) {
    // Update your UI with the new message
    const chatContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = message.sender.username === 'ai-assistant' 
      ? 'ai-message' 
      : 'user-message';
    messageElement.textContent = message.content;
    chatContainer?.appendChild(messageElement);
  }
}
```

---

## 🧪 Testing with cURL

### 1. Login and Get JWT Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Save the `accessToken` from response.

### 2. Send Message to AI
```bash
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Explain quantum computing in simple terms"
  }'
```

### 3. Get Conversation
```bash
curl -X GET http://localhost:8080/api/v1/ai/conversation \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Clear History
```bash
curl -X DELETE http://localhost:8080/api/v1/ai/conversation/history \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔍 How It Works

### Architecture Flow

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │ POST /api/v1/ai/chat
       ▼
┌──────────────────┐
│ ChatAiController │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌─────────────────┐
│  AiChatService   │─────▶│ ConversationSvc │
└────────┬─────────┘      └─────────────────┘
         │                         │
         │                         ▼
         │                  [Find/Create Conv]
         │
         ▼
┌────────────────────┐
│ Save User Message  │
└────────┬───────────┘
         │
         ▼
┌──────────────────────┐
│ Setup ChatMemory     │
│ (Load last 10 msgs)  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│   Call ChatClient    │
│   (OpenAI API)       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Save AI Response    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐      ┌──────────┐
│ Broadcast WebSocket  │─────▶│  Client  │
└──────────────────────┘      └──────────┘
```

### Memory Management

- **MongoChatMemoryImpl** stores messages in MongoDB
- Last **10 messages** are loaded for AI context
- Messages include both user and AI responses
- Memory is cleared with `DELETE /conversation/history`

---

## 🐛 Troubleshooting

### 1. **"API key not found"**
```bash
# Set environment variable
export SPRING_AI_OPENAI_API_KEY=sk-...

# Or add to application.properties
spring.ai.openai.api-key=sk-...
```

### 2. **"Conversation not found"**
- First message automatically creates conversation
- Check if user is authenticated
- Verify JWT token is valid

### 3. **"WebSocket connection failed"**
```java
// Check WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // Ensure proper CORS configuration
}
```

### 4. **AI Response is slow**
- OpenAI API có thể mất 2-5 seconds
- Consider adding loading indicator in frontend
- Check network connectivity

### 5. **Messages not appearing**
- Verify WebSocket connection established
- Check browser console for errors
- Ensure subscribed to correct topic: `/user/{userId}/queue/messages`

---

## 📊 Monitoring

### Check AI User Created
```javascript
// MongoDB Query
db.users.findOne({ username: "ai-assistant" })
```

### Check Conversations
```javascript
// Find all AI conversations
db.conversations.find({ 
  "participants.userId": "ai-assistant-user-id" 
})
```

### Check Messages
```javascript
// Get messages in conversation
db.messages.find({ 
  "conversation.$id": ObjectId("conversation-id") 
}).sort({ createdAt: -1 })
```

---

## 🎨 UI/UX Recommendations

### Chat Interface Design
```html
<div class="chat-container">
  <div class="chat-header">
    <h3>AI Assistant</h3>
    <button onclick="clearHistory()">Clear History</button>
  </div>
  
  <div class="chat-messages" id="messages">
    <!-- Messages will appear here -->
  </div>
  
  <div class="chat-input">
    <input type="text" id="message-input" placeholder="Ask AI anything...">
    <button onclick="sendMessage()">Send</button>
  </div>
</div>
```

### CSS Styling
```css
.user-message {
  background: #007bff;
  color: white;
  align-self: flex-end;
  margin: 5px 0;
  padding: 10px 15px;
  border-radius: 18px;
}

.ai-message {
  background: #e9ecef;
  color: #212529;
  align-self: flex-start;
  margin: 5px 0;
  padding: 10px 15px;
  border-radius: 18px;
}
```

---

## 🔒 Security Best Practices

1. **Never expose OpenAI API key** in frontend
2. **Rate limit** AI endpoints to prevent abuse
3. **Validate input** to prevent prompt injection
4. **Monitor costs** - OpenAI API charges per token
5. **Implement timeouts** for long-running AI calls

---

## 📈 Performance Tips

1. **Limit conversation history** to 10 messages (configurable)
2. **Use caching** for frequently asked questions
3. **Implement pagination** for message loading
4. **Optimize WebSocket** connections
5. **Consider using Redis** for high-traffic scenarios

---

## 📚 Additional Resources

- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [WebSocket with Spring Boot](https://spring.io/guides/gs/messaging-stomp-websocket/)

---

## ✅ Ready to Go!

Your AI Chat feature is fully implemented and ready for production use! 🚀

For questions or issues, check the logs in:
```bash
tail -f logs/instagram-backend.log
```

