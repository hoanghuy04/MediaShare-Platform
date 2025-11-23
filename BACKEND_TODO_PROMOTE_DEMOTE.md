# Backend Implementation Required

## Lỗi hiện tại
Frontend đang gọi 2 endpoints này nhưng backend chưa có:
- `POST /api/conversations/{conversationId}/members/{userId}/promote`
- `POST /api/conversations/{conversationId}/members/{userId}/demote`

## Cần thêm vào ConversationController.java

```java
@PostMapping("/{conversationId}/members/{userId}/promote")
@Operation(summary = "Promote a member to admin")
public ResponseEntity<ApiResponse<Void>> promoteMemberToAdmin(
        @PathVariable String conversationId,
        @PathVariable String userId,
        @RequestParam String promotedBy) {
    log.info("Promote member {} to admin in conversation {} by user {}", 
             userId, conversationId, promotedBy);
    
    conversationService.promoteMemberToAdmin(conversationId, userId, promotedBy);
    return ResponseEntity.ok(ApiResponse.success("Member promoted to admin successfully", null));
}

@PostMapping("/{conversationId}/members/{userId}/demote")
@Operation(summary = "Demote an admin to member")
public ResponseEntity<ApiResponse<Void>> demoteAdminToMember(
        @PathVariable String conversationId,
        @PathVariable String userId,
        @RequestParam String demotedBy) {
    log.info("Demote admin {} to member in conversation {} by user {}", 
             userId, conversationId, demotedBy);
    
    conversationService.demoteAdminToMember(conversationId, userId, demotedBy);
    return ResponseEntity.ok(ApiResponse.success("Admin demoted to member successfully", null));
}
```

## Cần thêm vào ConversationService interface

```java
/**
 * Promote a member to admin role
 */
void promoteMemberToAdmin(String conversationId, String userId, String promotedBy);

/**
 * Demote an admin to member role
 */
void demoteAdminToMember(String conversationId, String userId, String demotedBy);
```

## Cần implement trong ConversationServiceImpl

```java
@Override
@Transactional
public void promoteMemberToAdmin(String conversationId, String userId, String promotedBy) {
    Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    
    // Verify promoter is admin
    ConversationParticipant promoter = conversation.getParticipants().stream()
            .filter(p -> p.getUserId().equals(promotedBy))
            .findFirst()
            .orElseThrow(() -> new ForbiddenException("You are not a member of this conversation"));
    
    if (promoter.getRole() != ConversationRole.ADMIN) {
        throw new ForbiddenException("Only admins can promote members");
    }
    
    // Find and promote target member
    ConversationParticipant member = conversation.getParticipants().stream()
            .filter(p -> p.getUserId().equals(userId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
    
    if (member.getRole() == ConversationRole.ADMIN) {
        throw new BadRequestException("User is already an admin");
    }
    
    member.setRole(ConversationRole.ADMIN);
    conversationRepository.save(conversation);
    
    // Optional: Create system message
    Message systemMessage = Message.builder()
            .conversation(conversation)
            .type(MessageType.SYSTEM)
            .content(promoter.getUsername() + " đã chỉ định " + member.getUsername() + " làm quản trị viên")
            .timestamp(LocalDateTime.now())
            .build();
    messageRepository.save(systemMessage);
}

@Override
@Transactional
public void demoteAdminToMember(String conversationId, String userId, String demotedBy) {
    Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    
    // Verify demoter is admin
    ConversationParticipant demoter = conversation.getParticipants().stream()
            .filter(p -> p.getUserId().equals(demotedBy))
            .findFirst()
            .orElseThrow(() -> new ForbiddenException("You are not a member of this conversation"));
    
    if (demoter.getRole() != ConversationRole.ADMIN) {
        throw new ForbiddenException("Only admins can demote other admins");
    }
    
    // Find and demote target admin
    ConversationParticipant admin = conversation.getParticipants().stream()
            .filter(p -> p.getUserId().equals(userId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
    
    if (admin.getRole() != ConversationRole.ADMIN) {
        throw new BadRequestException("User is not an admin");
    }
    
    // Prevent demoting the last admin
    long adminCount = conversation.getParticipants().stream()
            .filter(p -> p.getRole() == ConversationRole.ADMIN)
            .count();
    
    if (adminCount <= 1) {
        throw new BadRequestException("Cannot demote the last admin. Promote another member first.");
    }
    
    admin.setRole(ConversationRole.MEMBER);
    conversationRepository.save(conversation);
    
    // Optional: Create system message
    Message systemMessage = Message.builder()
            .conversation(conversation)
            .type(MessageType.SYSTEM)
            .content(demoter.getUsername() + " đã gỡ vai trò quản trị viên của " + admin.getUsername())
            .timestamp(LocalDateTime.now())
            .build();
    messageRepository.save(systemMessage);
}
```

## Checklist
- [ ] Thêm 2 endpoints vào `ConversationController.java`
- [ ] Thêm 2 methods vào `ConversationService` interface
- [ ] Implement 2 methods trong `ConversationServiceImpl`
- [ ] Test API với Postman/Thunder Client
- [ ] Verify frontend hoạt động

## API Testing
```bash
# Promote member
curl -X POST "http://localhost:8080/api/conversations/{conversationId}/members/{userId}/promote?promotedBy={adminId}" \
  -H "Authorization: Bearer {token}"

# Demote admin
curl -X POST "http://localhost:8080/api/conversations/{conversationId}/members/{userId}/demote?demotedBy={adminId}" \
  -H "Authorization: Bearer {token}"
```
