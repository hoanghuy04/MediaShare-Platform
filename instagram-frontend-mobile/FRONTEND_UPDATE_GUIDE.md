# 📱 Hướng Dẫn Cập Nhật Frontend Mobile

## ✅ Đã hoàn thành

### 1. **Types (`types/message.ts`)** ✅
- Xóa `isRead: boolean` → Thay bằng `readBy: string[]`
- Xóa `unreadCount` từ `Conversation`
- Thêm `UserSummary`, `LastMessage`, `MessageRequest` interfaces
- Cập nhật `Conversation` và `Message` để khớp với backend DTO

### 2. **API Routes (`config/routes.ts`)** ✅
- Cập nhật endpoints mới:
  - `/api/conversations` - Get all conversations
  - `/api/conversations/{id}/messages` - Get messages
  - `/api/conversations/{conversationId}/messages` - Send message
  - `/api/conversations/direct/messages` - Send direct message
  - `/api/conversations/messages/{messageId}/read` - Mark as read
  - `/api/conversations/messages/{messageId}` - Delete message (soft)
  - `/api/conversations/{id}` - Delete conversation
- Thêm endpoints cho Group Chat và Message Requests

### 3. **API Service (`services/api.ts`)** ✅
- Thêm `messageRequestAPI` export mới
- Cập nhật `messageAPI`:
  - `getConversations()` - Lấy danh sách conversation
  - `getConversation()` - Lấy chi tiết conversation
  - `getMessages()` - Lấy messages trong conversation
  - `sendDirectMessage()` - Gửi tin nhắn trực tiếp (auto-create conversation)
  - `sendMessage()` - Gửi tin nhắn vào conversation hiện có
  - `markAsRead()` - Đánh dấu đã đọc (đánh dấu tất cả messages trong conversation)
  - `deleteMessage()` - Xóa message (soft delete)
  - `deleteConversation()` - Xóa conversation (soft delete)
  - `createGroup()` - Tạo group chat
  - `updateGroup()` - Cập nhật group info
  - `leaveGroup()` - Rời group

### 4. **Utils (`utils/messageUtils.ts`)** ✅ - MỚI
Helper functions để:
- `isMessageRead()` - Check nếu message đã được đọc bởi user hiện tại
- `calculateUnreadCount()` - Tính số tin nhắn chưa đọc từ array `readBy`
- `hasUnreadMessages()` - Check conversation có tin nhắn chưa đọc
- `formatReadReceipts()` - Format read receipts cho group chat
- `getConversationName()` - Lấy tên conversation (user hoặc group)
- `getConversationAvatar()` - Lấy avatar conversation
- `getOtherUser()` - Lấy user còn lại trong direct chat
- `formatMessageTime()` - Format thời gian hiển thị
- `sortConversationsByRecent()` - Sắp xếp conversations theo thời gian

### 5. **Messages Screen (`app/messages/index.tsx`)** ✅
- Đơn giản hóa state management
- Xóa các function phức tạp (`loadFollowingUsers`, `loadLastMessagesForUsers`)
- Sử dụng `sortConversationsByRecent()` để sort conversations
- Sử dụng `getConversationName()` và `getConversationAvatar()` để hiển thị
- Tính unread count từ `conversationMessages` state (sẽ fetch on-demand)
- Cập nhật WebSocket handlers để dùng `conversationId` thay vì `userId`
- Hiển thị typing indicator cho conversations
- Thêm icon group cho group chats

---

## 🚧 Cần cập nhật tiếp

### 6. **Conversation Detail Screen (`app/messages/[conversationId].tsx`)** 
File này cần refactor lớn vì đang dùng cấu trúc cũ với `isRead: boolean`.

#### Các thay đổi cần thiết:

**a. Import và Types:**
```typescript
import {
  getConversationName,
  getConversationAvatar,
  isMessageRead,
  formatReadReceipts,
} from '../../utils/messageUtils';
import { Conversation, Message } from '../../types';
```

**b. State Management:**
```typescript
// Thay đổi từ loading messages theo userId sang conversationId
const [conversation, setConversation] = useState<Conversation | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
```

**c. Load Messages:**
```typescript
const loadMessages = async () => {
  try {
    setIsLoading(true);
    // Load conversation details
    const conv = await messageAPI.getConversation(conversationId);
    setConversation(conv);
    
    // Load messages
    const response = await messageAPI.getMessages(conversationId, 0, 50);
    setMessages(response.content);
  } catch (error) {
    console.error('Error loading messages:', error);
    showAlert('Error', 'Không thể tải tin nhắn');
  } finally {
    setIsLoading(false);
  }
};
```

**d. Send Message:**
```typescript
const handleSend = async (text: string) => {
  try {
    const newMessage = await messageAPI.sendMessage(
      conversationId,
      text,
      undefined, // mediaUrl
      undefined  // replyToMessageId
    );
    
    setMessages(prev => [newMessage, ...prev]);
    
    // Optional: send via WebSocket for real-time
    sendWebSocketMessage({
      type: 'CHAT',
      conversationId,
      content: text,
    });
  } catch (error) {
    showAlert('Error', 'Không thể gửi tin nhắn');
  }
};
```

**e. Mark as Read:**
```typescript
// Mark first unread message as read (will mark all in conversation)
const markConversationAsRead = async () => {
  if (!user?.id) return;
  
  const unreadMessages = messages.filter(
    msg => msg.sender.id !== user.id && !msg.readBy.includes(user.id)
  );
  
  if (unreadMessages.length > 0) {
    try {
      // Mark the first unread message (backend will mark all)
      await messageAPI.markAsRead(unreadMessages[0].id);
      
      // Update local state
      setMessages(prev =>
        prev.map(msg => {
          if (!msg.readBy.includes(user.id)) {
            return { ...msg, readBy: [...msg.readBy, user.id] };
          }
          return msg;
        })
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }
};
```

**f. WebSocket Message Handler:**
```typescript
const handleWebSocketMessage = (message: any) => {
  if (message.type === 'CHAT' && message.conversationId === conversationId) {
    // Convert and add to messages
    const newMessage: Message = {
      id: message.id,
      conversationId: message.conversationId,
      sender: {
        id: message.senderId,
        username: message.senderUsername,
        avatar: message.senderAvatar,
        isVerified: false,
      },
      content: message.content,
      mediaUrl: message.mediaUrl,
      readBy: message.readBy || [],
      replyTo: message.replyTo,
      createdAt: message.timestamp,
      isDeleted: false,
    };
    
    setMessages(prev => [newMessage, ...prev]);
    
    // Mark as read if not from current user
    if (message.senderId !== user?.id) {
      messageAPI.markAsRead(newMessage.id);
    }
  }
};
```

**g. Read Receipt Handler:**
```typescript
const handleReadReceipt = (messageId: string, userId: string) => {
  setMessages(prev =>
    prev.map(msg => {
      if (msg.id === messageId && !msg.readBy.includes(userId)) {
        return { ...msg, readBy: [...msg.readBy, userId] };
      }
      return msg;
    })
  );
};
```

**h. Render Message with Read Status:**
```typescript
const renderMessage = ({ item }: { item: Message }) => {
  const isOwnMessage = item.sender.id === user?.id;
  const isRead = item.readBy.includes(user?.id || '');
  
  // For group chats: show read receipts
  let readReceipt = '';
  if (isOwnMessage && conversation?.type === 'GROUP') {
    readReceipt = formatReadReceipts(item, conversation.participants);
  }
  
  return (
    <ChatMessage
      message={item}
      isOwnMessage={isOwnMessage}
      isRead={isRead}
      readReceipt={readReceipt}
    />
  );
};
```

**i. Header với conversation name:**
```typescript
const renderHeader = () => {
  if (!conversation || !user) return null;
  
  const name = getConversationName(conversation, user.id);
  const avatar = getConversationAvatar(conversation, user.id);
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerCenter}
        onPress={() => {
          // Navigate to conversation settings
          if (conversation.type === 'GROUP') {
            router.push(`/messages/conversation-settings?id=${conversationId}`);
          } else {
            const otherUser = conversation.participants.find(p => p.id !== user.id);
            router.push(`/users/${otherUser?.id}`);
          }
        }}
      >
        <Avatar uri={avatar} name={name} size={36} />
        <View>
          <Text style={styles.headerTitle}>{name}</Text>
          {conversation.type === 'GROUP' && (
            <Text style={styles.headerSubtitle}>
              {conversation.participants.length} members
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Actions */}
      <TouchableOpacity>
        <Ionicons name="videocam-outline" size={24} />
      </TouchableOpacity>
      <TouchableOpacity>
        <Ionicons name="call-outline" size={24} />
      </TouchableOpacity>
    </View>
  );
};
```

---

## 🔄 Các Component Cần Cập Nhật

### 1. `ChatMessage.tsx`
Cập nhật để:
- Nhận `isRead` prop từ parent (tính từ `readBy.includes(userId)`)
- Hiển thị read receipts cho group chats
- Hỗ trợ threading (reply to message)

```typescript
interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  isRead: boolean;
  readReceipt?: string; // For group chats
  onReply?: () => void;
}
```

### 2. `ConversationList.tsx` (nếu có)
- Sử dụng `sortConversationsByRecent()`
- Tính unread count từ `messages` array
- Hiển thị typing indicator

### 3. `MessageInput.tsx`
- Cập nhật `onSend` callback để nhận `conversationId`
- Hỗ trợ reply to message

---

## 📝 Testing Checklist

- [ ] Load danh sách conversations
- [ ] Hiển thị đúng tên và avatar (both direct và group)
- [ ] Hiển thị số tin nhắn chưa đọc chính xác
- [ ] Gửi tin nhắn mới
- [ ] Nhận tin nhắn real-time qua WebSocket
- [ ] Mark as read khi mở conversation
- [ ] Mark as read khi gửi tin nhắn phản hồi (auto-mark)
- [ ] Hiển thị typing indicator
- [ ] Hiển thị read receipts cho group chat
- [ ] Xóa message (soft delete)
- [ ] Xóa conversation (soft delete)
- [ ] Tạo group chat mới
- [ ] Rời group chat
- [ ] Message requests (pending messages)

---

## 🎨 UI/UX Improvements

1. **Group Chat Indicator**: Thêm icon "people" cho group chats
2. **Read Receipts**: Hiển thị "Seen by X and Y" trong group chats
3. **Typing Indicator**: "X is typing..." trong conversation list
4. **Last Message Preview**: Hiển thị sender name trong group chats
5. **Unread Count Badge**: Tính toán động từ `readBy` array
6. **Auto-scroll**: Scroll to bottom khi nhận tin nhắn mới
7. **Pull to Refresh**: Refresh conversations và messages

---

## 🔧 Advanced Features (Optional)

1. **Message Threading**: Reply to specific messages
2. **Message Reactions**: Like, love, etc.
3. **Message Search**: Tìm kiếm trong conversation
4. **Media Gallery**: Xem tất cả ảnh/video trong conversation
5. **Voice Messages**: Gửi voice notes
6. **Message Forwarding**: Forward messages to other conversations
7. **Message Deletion for Everyone**: Admin can delete for all (group)
8. **Read Receipts Toggle**: Tắt/bật read receipts (privacy)

---

## 📚 Tài Liệu Tham Khảo

- Backend API: `Instagram_Refactored_Chat_API.postman_collection.json`
- Backend DTOs: `ConversationDTO.java`, `MessageDTO.java`
- Utils: `messageUtils.ts`
- Types: `types/message.ts`

---

## ⚠️ Lưu Ý Quan Trọng

1. **Không còn `isRead: boolean`**: Dùng `readBy: string[]`
2. **Không còn `unreadCount` trong DTO**: Frontend tự tính từ messages
3. **Auto-mark on reply**: Backend tự động mark all messages as read khi user reply
4. **Soft Delete**: Messages và conversations chỉ bị ẩn, không bị xóa hẳn
5. **WebSocket**: Cần handle cả `conversationId` trong message events

---

Nếu cần hỗ trợ implementation cụ thể, hãy cho tôi biết file nào cần update!

