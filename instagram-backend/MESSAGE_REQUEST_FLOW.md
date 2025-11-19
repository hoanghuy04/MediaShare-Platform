## Message Request & Conversation Conversion Rules

### 1. Business Overview

- System supports direct (1–1), group, and message requests when users aren’t mutually connected.
- First-time messages without mutual follow never create a conversation; they enqueue pending messages inside a `MessageRequest`.
- Mutual followers go straight into a `DIRECT` conversation; `lastMessage` always reflects the latest saved message.
- When the receiver replies or accepts a pending request, pending messages are linked to the new/existing conversation chronologically before the reply is appended.

### 2. Safety Guarantees

- `Conversation` stores `participantsNormalized=[minId,maxId]` with a unique partial index (`type=DIRECT`), preventing duplicate docs under race conditions.
- `ConversationService.createDirectConversation` catches Mongo duplicate-key errors, re-reads the winner, and returns it.
- Conversion flows run in a transaction: find/create conversation → attach pending messages → persist reply → update `lastMessage` → update request status.
- Retry-safe: re-running accept/reply when already processed simply reuses the existing conversation and skips already-linked messages.

### 3. Core Helper Functions (`MessageRequestServiceImpl`)

| Function                                                                         | Purpose                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolvePreviewContent(Message message)`                                         | Normalizes preview text for inbox/request cards. Returns `message.getContent()` or `[Media]` when content is null.                                                                                                                    |
| `linkPendingMessages(Conversation conversation, List<String> pendingMessageIds)` | Converts queued pending messages into the real conversation. Loads all IDs, sorts by `createdAt`, sets `conversation` on each unlinked message, persists, and returns the newest linked message so callers can refresh `lastMessage`. |

### 4. API Contract Highlights

- `POST /conversations/direct/messages`: Orchestrator decides whether to route into a conversation (mutual follow or existing direct) or create/update a message request.
- `GET /message-requests/pending-messages?senderId&receiverId`: Lists all pending messages sorted ascending, each with full `MessageDTO.sender`.
- `POST /message-requests/{id}/accept|reject|ignore`: Accept triggers the conversion transaction described above.

### 5. Frontend Notes

- Inbox mixes normal conversations and the user’s own pending requests (tab “Tin nhắn đang chờ”).
- Opening a request routes to a read-only thread identified by `otherUserId`. FE calls the pending-messages API to render history until accept/reply occurs.
- Once BE returns a real `conversationId` (after accept or reply), FE transitions to the standard conversation APIs; state `isNewConversation` flips to false.
