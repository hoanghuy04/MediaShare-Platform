# AI Chat - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Set OpenAI API Key
```bash
export OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
```

### 2. Start Application
```bash
./mvnw spring-boot:run
```

### 3. Test API
```bash
# Login first
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Save the token and use it
export TOKEN="eyJhbGc..."

# Send message to AI
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello AI!"}'
```

---

## 📡 API Endpoints (Quick Reference)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/ai/chat` | POST | USER | Chat with AI |
| `/api/v1/ai/conversation` | GET | USER | Get conversation |
| `/api/v1/ai/conversation/history` | DELETE | USER | Clear history |

---

## 💬 Request/Response Examples

### Send Message
```bash
POST /api/v1/ai/chat
Authorization: Bearer {token}

{
  "content": "What is Spring Boot?"
}

# Response
{
  "code": 200,
  "message": "AI responded successfully",
  "data": {
    "id": "msg-123",
    "content": "Spring Boot is...",
    "sender": {...}
  }
}
```

---

## 🗂️ File Structure

```
src/main/java/.../
├── controller/
│   └── ChatAiController.java          ← REST endpoints
├── service/ai/
│   ├── AiChatService.java            ← Interface
│   ├── AiChatServiceImpl.java        ← Implementation
│   └── MongoChatMemoryImpl.java      ← Memory storage
└── repository/
    └── MessageRepository.java         ← Enhanced with AI methods
```

---

## 🔑 Key Components

### MongoChatMemoryImpl
- Stores last 10 messages
- Auto-creates AI user
- WebSocket integration

### AiChatServiceImpl
- Calls OpenAI API
- Manages conversations
- Error handling

### ChatAiController
- REST endpoints
- JWT auth
- Input validation

---

## ⚙️ Configuration

### Required in application.properties:
```properties
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.options.model=gpt-4
spring.data.mongodb.uri=mongodb://localhost:27017/instagram
```

### Environment Variable:
```bash
export OPENAI_API_KEY=sk-proj-...
```

---

## 🔍 Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token |
| API key error | Set `OPENAI_API_KEY` |
| Slow response | OpenAI can take 2-5 seconds |
| No WebSocket | Check connection & subscription |

---

## 📊 How Memory Works

```
User: "Hello"              (saved)
AI: "Hi there!"            (saved)
User: "What's your name?"  (saved)
AI: "I'm an AI assistant"  (saved)
...
(Only last 10 messages kept for context)
```

---

## 🧪 Test Scenarios

1. **First message**: `"Hello AI"`
2. **Follow-up**: `"Tell me about yourself"`
3. **Clear history**: `DELETE /conversation/history`
4. **New message**: Context reset

---

## 🎯 Frontend Integration

```javascript
// Send message
const response = await fetch('/api/v1/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ content: userMessage })
});

const data = await response.json();
console.log(data.data.content); // AI response
```

---

## 📦 Import Postman Collection

1. Open Postman
2. Import → `AI_Chat_Postman_Collection.json`
3. Set `accessToken` variable
4. Start testing!

---

## 🛠️ Useful Commands

```bash
# Check MongoDB
mongosh
use instagram
db.messages.find().limit(10).pretty()

# View logs
tail -f logs/instagram-backend.log

# Check AI user
db.users.findOne({username: "ai-assistant"})

# Count messages
db.messages.countDocuments()
```

---

## 📚 Documentation Files

- **AI_CHAT_README.md** - Full documentation
- **AI_Chat_Postman_Collection.json** - API tests
- **This file** - Quick reference

---

## ✅ Status Checklist

- [x] MongoChatMemory implemented
- [x] AiChatService implemented
- [x] ChatAiController implemented
- [x] MessageRepository enhanced
- [x] WebSocket integration
- [x] Error handling
- [x] Documentation
- [x] Postman collection

---

## 🎉 Ready to Use!

Everything is set up and ready. Just:
1. Set your OpenAI API key
2. Start the server
3. Begin chatting with AI!

**Need help?** Check `AI_CHAT_README.md` for detailed guide.

