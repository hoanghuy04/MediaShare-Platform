package com.hoanghuy04.instagrambackend.migration;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.LastMessageInfo;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.message.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for migrating existing chat data to the new conversation-based structure.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMigrationService {
    
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    
    /**
     * Step 1: Create conversations from existing messages.
     * Groups messages by sender-receiver pairs and creates Conversation entities.
     * Migrates isRead to readBy format.
     */
    @Transactional
    public void migrateToConversations() {
        log.info("====================================================");
        log.info("Starting migration: Creating conversations from messages...");
        log.info("====================================================");
        
        // 1. Get all existing messages
        List<Message> allMessages = messageRepository.findAll();
        log.info("Found {} existing messages", allMessages.size());
        
        if (allMessages.isEmpty()) {
            log.info("No messages found. Migration skipped.");
            return;
        }
        
        // 2. Group messages by unique sender-receiver pairs
        Map<String, List<Message>> conversationGroups = new HashMap<>();
        int skippedMessages = 0;
        
        for (Message msg : allMessages) {
            // Skip messages that already have conversation (already migrated)
            if (msg.getConversation() != null) {
                skippedMessages++;
                continue;
            }
            
            // Skip messages with null sender or receiver
            if (msg.getSender() == null || msg.getReceiver() == null) {
                log.warn("Skipping message {} with null sender or receiver", msg.getId());
                skippedMessages++;
                continue;
            }
            
            String senderId = msg.getSender().getId();
            String receiverId = msg.getReceiver().getId();
            
            // Create consistent key (sorted IDs)
            String key = createConversationKey(senderId, receiverId);
            conversationGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(msg);
        }
        
        if (skippedMessages > 0) {
            log.info("Skipped {} messages (already migrated or invalid)", skippedMessages);
        }
        
        log.info("Found {} unique conversation pairs", conversationGroups.size());
        
        // 3. Create Conversation for each pair
        int createdConversations = 0;
        int migratedMessages = 0;
        
        for (Map.Entry<String, List<Message>> entry : conversationGroups.entrySet()) {
            String[] userIds = entry.getKey().split("_");
            List<Message> messages = entry.getValue();
            
            // Sort messages by createdAt
            messages.sort(Comparator.comparing(Message::getCreatedAt));
            
            // Create conversation
            List<String> participants = Arrays.asList(userIds);
            Conversation conversation = Conversation.builder()
                .type(ConversationType.DIRECT)
                .participants(participants)
                .createdBy(participants.get(0))
                .members(createInitialMembers(participants, participants.get(0)))
                .createdAt(messages.get(0).getCreatedAt())
                .updatedAt(messages.get(messages.size() - 1).getCreatedAt())
                .build();
            
            // Set last message
            Message lastMessage = messages.get(messages.size() - 1);
            conversation.setLastMessage(LastMessageInfo.builder()
                .messageId(lastMessage.getId())
                .content(lastMessage.getContent() != null ? lastMessage.getContent() : "[Media]")
                .senderId(lastMessage.getSender().getId())
                .timestamp(lastMessage.getCreatedAt())
                .build());
            
            Conversation savedConversation = conversationRepository.save(conversation);
            createdConversations++;
            
            log.info("Created conversation {} for users: {} <-> {}", 
                savedConversation.getId(), userIds[0], userIds[1]);
            
            // 4. Update messages with conversation reference
            for (Message msg : messages) {
                msg.setConversation(savedConversation);
                
                // Migrate isRead to readBy
                if (msg.isRead() && msg.getReceiver() != null) {
                    if (msg.getReadBy() == null || msg.getReadBy().isEmpty()) {
                        msg.setReadBy(Collections.singletonList(msg.getReceiver().getId()));
                    }
                }
                
                messageRepository.save(msg);
                migratedMessages++;
            }
        }
        
        log.info("====================================================");
        log.info("Migration completed successfully!");
        log.info("- Created {} conversations", createdConversations);
        log.info("- Migrated {} messages", migratedMessages);
        log.info("====================================================");
    }
    
    /**
     * Step 2: Cleanup deprecated fields (optional, after verifying migration).
     * Sets receiver = null and isRead = false for all messages.
     * WARNING: This is a destructive operation!
     */
    @Transactional
    public void cleanupDeprecatedFields() {
        log.info("====================================================");
        log.info("Starting cleanup: Removing deprecated fields...");
        log.info("====================================================");
        
        List<Message> allMessages = messageRepository.findAll();
        log.info("Found {} messages to cleanup", allMessages.size());
        
        int cleanedMessages = 0;
        for (Message msg : allMessages) {
            // Only cleanup if conversation is set (migration was successful)
            if (msg.getConversation() != null) {
                msg.setReceiver(null);
                msg.setRead(false);
                messageRepository.save(msg);
                cleanedMessages++;
            }
        }
        
        log.info("====================================================");
        log.info("Cleanup completed successfully!");
        log.info("- Cleaned {} messages", cleanedMessages);
        log.info("====================================================");
    }
    
    /**
     * Create a consistent conversation key from two user IDs.
     * Always sorts IDs to ensure same key for both directions.
     */
    private String createConversationKey(String userId1, String userId2) {
        return userId1.compareTo(userId2) < 0 
            ? userId1 + "_" + userId2 
            : userId2 + "_" + userId1;
    }
    
    /**
     * Create initial members list for a conversation.
     */
    private List<com.hoanghuy04.instagrambackend.entity.message.ConversationMember> createInitialMembers(
        List<String> participants, 
        String createdBy
    ) {
        return participants.stream()
            .map(userId -> com.hoanghuy04.instagrambackend.entity.message.ConversationMember.builder()
                .userId(userId)
                .joinedAt(LocalDateTime.now())
                .role(com.hoanghuy04.instagrambackend.enums.MemberRole.MEMBER)
                .build())
            .collect(Collectors.toList());
    }
}

