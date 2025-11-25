package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.ConversationInviteLink;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationInviteLinkRepository extends MongoRepository<ConversationInviteLink, String> {
    Optional<ConversationInviteLink> findByTokenAndActiveTrue(String token);
    List<ConversationInviteLink> findByConversationIdAndActiveTrue(String conversationId);
    List<ConversationInviteLink> findByConversationIdOrderByCreatedAtDesc(String conversationId);
}

