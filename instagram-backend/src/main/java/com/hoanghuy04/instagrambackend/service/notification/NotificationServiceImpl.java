package com.hoanghuy04.instagrambackend.service.notification;

import com.hoanghuy04.instagrambackend.dto.response.NotificationResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.Notification;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.NotificationType;
import com.hoanghuy04.instagrambackend.mapper.NotificationMapper;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.NotificationRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.service.websocket.NotificationWebSocketService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/*
 * @description: NotificationServiceImpl
 */
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final NotificationMapper notificationMapper;
    private final NotificationWebSocketService notificationWebSocketService;
    private final SecurityUtil securityUtil;

    // ========================
    // CREATE
    // ========================

    @Override
    public NotificationResponse createFollowNotification(String receiverId) {
        String senderId = securityUtil.getCurrentUserId();
        if (senderId.equals(receiverId)) return null;

        Notification n = Notification.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .type(NotificationType.FOLLOW)
                .createdAt(Instant.now())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(n);
        return pushRealtime(saved);
    }

    @Override
    public NotificationResponse createLikePostNotification(String receiverId, String postId) {
        String senderId = securityUtil.getCurrentUserId();
        if (senderId.equals(receiverId)) return null;

        Notification n = Notification.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .postId(postId)
                .type(NotificationType.LIKE_POST)
                .createdAt(Instant.now())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(n);
        return pushRealtime(saved);
    }

    @Override
    public NotificationResponse createLikeCommentNotification(String receiverId, String postId, String commentId) {
        String senderId = securityUtil.getCurrentUserId();
        if (senderId.equals(receiverId)) return null;

        Notification n = Notification.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .postId(postId)
                .commentId(commentId)
                .type(NotificationType.LIKE_COMMENT)
                .createdAt(Instant.now())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(n);
        return pushRealtime(saved);
    }

    @Override
    public NotificationResponse createCommentPostNotification(String receiverId, String postId, String message) {
        String senderId = securityUtil.getCurrentUserId();
        if (senderId.equals(receiverId)) return null;

        Notification n = Notification.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .postId(postId)
                .message(message)
                .type(NotificationType.COMMENT_POST)
                .createdAt(Instant.now())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(n);
        return pushRealtime(saved);
    }

    @Override
    public NotificationResponse createTagInCommentNotification(String receiverId, String postId, String commentId) {
        String senderId = securityUtil.getCurrentUserId();
        if (senderId.equals(receiverId)) return null;

        Notification n = Notification.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .postId(postId)
                .commentId(commentId)
                .type(NotificationType.TAG_IN_COMMENT)
                .createdAt(Instant.now())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(n);
        return pushRealtime(saved);
    }

    // ========================
    // QUERY
    // ========================

    @Override
    public PageResponse<NotificationResponse> getUserNotifications(Pageable pageable) {
        String userId = securityUtil.getCurrentUserId();

        Page<Notification> page =
                notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId, pageable);

        List<Notification> notifications = page.getContent();

        // load actors
        Set<String> actorIds = notifications.stream()
                .map(Notification::getSenderId)
                .collect(Collectors.toSet());

        Map<String, User> actorMap = userRepository.findAllById(actorIds)
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // load posts
        Set<String> postIds = notifications.stream()
                .map(Notification::getPostId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Post> postMap = postRepository.findAllById(postIds)
                .stream()
                .collect(Collectors.toMap(Post::getId, p -> p));

        // current user đang follow những ai
        Set<String> followingIds = followRepository.findByFollowerId(userId)
                .stream()
                .map(Follow::getFollowingId)
                .collect(Collectors.toSet());

        Page<NotificationResponse> dtoPage = page.map(n ->
                notificationMapper.toNotificationResponse(
                        n,
                        actorMap.get(n.getSenderId()),
                        followingIds.contains(n.getSenderId()),
                        n.getPostId() != null ? postMap.get(n.getPostId()) : null
                )
        );

        return PageResponse.of(dtoPage);
    }

    @Override
    public void markAsRead(String notificationId) {
        String userId = securityUtil.getCurrentUserId();
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getReceiverId().equals(userId) && !n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Override
    public com.hoanghuy04.instagrambackend.dto.response.UnreadCountResponse getUnreadCount() {
        String userId = securityUtil.getCurrentUserId();
        List<Notification> unreadNotifications = notificationRepository.findByReceiverIdAndReadFalse(userId);
        
        // Group by type
        Map<String, Long> byType = unreadNotifications.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                n -> n.getType().name(),
                java.util.stream.Collectors.counting()
            ));
        
        return com.hoanghuy04.instagrambackend.dto.response.UnreadCountResponse.builder()
            .total((long) unreadNotifications.size())
            .byType(byType)
            .build();
    }

    @Override
    public void markAllAsRead() {
        String userId = securityUtil.getCurrentUserId();
        List<Notification> unreadNotifications = notificationRepository.findByReceiverIdAndReadFalse(userId);
        if (!unreadNotifications.isEmpty()) {
            unreadNotifications.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(unreadNotifications);
        }
    }

    // ========================
    // Helper: push realtime
    // ========================

    private NotificationResponse pushRealtime(Notification n) {
        User actor = userRepository.findById(n.getSenderId()).orElse(null);

        Post post = null;
        if (n.getPostId() != null) {
            post = postRepository.findById(n.getPostId()).orElse(null);
        }

        boolean isFollowingBack = followRepository
                .existsByFollowerIdAndFollowingId(n.getReceiverId(), n.getSenderId());

        NotificationResponse dto = notificationMapper.toNotificationResponse(
                n,
                actor,
                isFollowingBack,
                post
        );

        notificationWebSocketService.pushNotification(n.getReceiverId(), dto);
        return dto;
    }
}
