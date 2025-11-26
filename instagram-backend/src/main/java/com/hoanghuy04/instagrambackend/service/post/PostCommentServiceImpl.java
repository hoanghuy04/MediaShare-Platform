package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.request.CommentCreateRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentLikeToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentPinToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeUserResponse;
import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Like;
import com.hoanghuy04.instagrambackend.entity.Mention;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.LikeTargetType;
import com.hoanghuy04.instagrambackend.enums.MentionTargetType;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.CommentRepository;
import com.hoanghuy04.instagrambackend.repository.LikeRepository;
import com.hoanghuy04.instagrambackend.repository.MentionRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.service.notification.NotificationService; // 👈
import com.hoanghuy04.instagrambackend.util.MentionUtil;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostCommentServiceImpl implements PostCommentService {

    private static final int MAX_PINNED_COMMENTS = 2;

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final MentionRepository mentionRepository;
    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;
    private final MentionUtil mentionUtil;
    private final NotificationService notificationService; // 👈

    // ==============================
    // CREATE COMMENT
    // ==============================
    @Transactional
    @Override
    public CommentResponse createComment(String postId, CommentCreateRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User currentUser = securityUtil.getCurrentUser();

        Comment parent = null;
        if (request.getParentCommentId() != null && !request.getParentCommentId().isBlank()) {
            parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));

            if (!parent.getPost().getId().equals(post.getId())) {
                throw new IllegalArgumentException("Parent comment does not belong to this post");
            }

            parent.setTotalReply(parent.getTotalReply() + 1);
            commentRepository.save(parent);
        }

        String rawText = request.getText() != null ? request.getText().trim() : "";

        Comment comment = Comment.builder()
                .post(post)
                .author(currentUser)
                .text(rawText)
                .parentComment(parent)
                .totalLikes(0L)
                .totalReply(0L)
                .pinned(false)
                .build();

        Comment saved = commentRepository.save(comment);

        post.setTotalComments(post.getTotalComments() + 1);
        postRepository.save(post);

        // 🔔 noti cho chủ bài viết khi có comment (trừ tự cmt bài mình)
        User postAuthor = post.getAuthor();
        if (postAuthor != null && !postAuthor.getId().equals(currentUser.getId())) {
            notificationService.createCommentPostNotification(
                    postAuthor.getId(),
                    post.getId(),
                    rawText
            );
        }

        // 🔔 sync mention + noti TAG_IN_COMMENT
        syncMentionsForComment(saved, rawText, currentUser.getId());

        return mapToCommentResponse(saved, false);
    }

    // ==============================
    // GET COMMENTS
    // ==============================
    @Transactional(readOnly = true)
    @Override
    public PageResponse<CommentResponse> getComments(String postId, Pageable pageable) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User currentUser = securityUtil.getCurrentUser();

        Page<Comment> page = commentRepository.findByPostAndParentCommentIsNull(post, pageable);

        return mapCommentPageWithLikeInfo(page, currentUser);
    }

    // ==============================
    // GET REPLIES
    // ==============================
    @Transactional(readOnly = true)
    @Override
    public PageResponse<CommentResponse> getReplies(String postId, String parentCommentId, Pageable pageable) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));

        if (!parent.getPost().getId().equals(post.getId())) {
            throw new IllegalArgumentException("Parent comment does not belong to this post");
        }

        User currentUser = securityUtil.getCurrentUser();

        Page<Comment> page = commentRepository.findByPostAndParentComment(post, parent, pageable);

        return mapCommentPageWithLikeInfo(page, currentUser);
    }

    // ==============================
    // TOGGLE LIKE COMMENT
    // ==============================
    @Transactional
    @Override
    public CommentLikeToggleResponse toggleLikeComment(String postId, String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("Comment does not belong to this post");
        }

        User currentUser = securityUtil.getCurrentUser();

        Optional<Like> existing = likeRepository.findByUserAndTargetTypeAndTargetId(
                currentUser,
                LikeTargetType.COMMENT,
                commentId
        );

        boolean liked;
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            comment.setTotalLikes(Math.max(0, comment.getTotalLikes() - 1));
            liked = false;
        } else {
            Like like = Like.builder()
                    .user(currentUser)
                    .targetType(LikeTargetType.COMMENT)
                    .targetId(commentId)
                    .build();

            likeRepository.save(like);
            comment.setTotalLikes(comment.getTotalLikes() + 1);
            liked = true;

            // 🔔 noti cho chủ comment khi được like (trừ tự like)
            User commentAuthor = comment.getAuthor();
            if (commentAuthor != null && !commentAuthor.getId().equals(currentUser.getId())) {
                notificationService.createLikeCommentNotification(
                        commentAuthor.getId(),
                        postId,
                        commentId
                );
            }
        }

        commentRepository.save(comment);

        return CommentLikeToggleResponse.builder()
                .postId(postId)
                .commentId(commentId)
                .liked(liked)
                .totalLikes(comment.getTotalLikes())
                .build();
    }

    // ==============================
    // TOGGLE PIN COMMENT
    // ==============================
    @Transactional
    @Override
    public CommentPinToggleResponse togglePinComment(String postId, String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        Post post = comment.getPost();
        if (post == null || !post.getId().equals(postId)) {
            throw new IllegalArgumentException("Comment does not belong to this post");
        }

        User currentUser = securityUtil.getCurrentUser();

        if (!post.getAuthor().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Only post owner can pin comments");
        }

        if (comment.getParentComment() != null) {
            throw new IllegalStateException("Only top-level comments can be pinned");
        }

        boolean newPinnedState;

        if (comment.isPinned()) {
            comment.setPinned(false);
            newPinnedState = false;
        } else {
            long pinnedCount = commentRepository.countByPostAndParentCommentIsNullAndPinnedTrue(post);
            if (pinnedCount >= MAX_PINNED_COMMENTS) {
                throw new IllegalStateException("Maximum pinned comments reached");
            }
            comment.setPinned(true);
            newPinnedState = true;
        }

        commentRepository.save(comment);

        long totalPinned = commentRepository.countByPostAndParentCommentIsNullAndPinnedTrue(post);

        return CommentPinToggleResponse.builder()
                .postId(postId)
                .commentId(commentId)
                .pinned(newPinnedState)
                .totalPin(totalPinned)
                .userId(currentUser.getId())
                .build();
    }

    // ==============================
    // DELETE COMMENT
    // ==============================
    @Transactional
    @Override
    public void deleteComment(String postId, String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        Post post = comment.getPost();
        if (post == null || !post.getId().equals(postId)) {
            throw new IllegalArgumentException("Comment does not belong to this post");
        }

        User currentUser = securityUtil.getCurrentUser();

        boolean isOwnerOfComment = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isOwnerOfPost = post.getAuthor().getId().equals(currentUser.getId());

        if (!isOwnerOfComment && !isOwnerOfPost) {
            throw new IllegalStateException("You do not have permission to delete this comment");
        }

        long decrement = 1L;

        if (comment.getParentComment() == null) {
            List<Comment> replies = commentRepository.findByParentComment_Id(commentId);

            if (!replies.isEmpty()) {
                List<String> replyIds = replies.stream().map(Comment::getId).toList();

                replyIds.forEach(id ->
                        likeRepository.deleteByTargetTypeAndTargetId(LikeTargetType.COMMENT, id)
                );

                replyIds.forEach(id ->
                        mentionRepository.deleteByTargetTypeAndTargetId(MentionTargetType.COMMENT, id)
                );

                commentRepository.deleteAll(replies);
                decrement += replies.size();
            }
        } else {
            Comment parent = comment.getParentComment();
            parent.setTotalReply(Math.max(0, parent.getTotalReply() - 1));
            commentRepository.save(parent);
        }

        post.setTotalComments(Math.max(0, post.getTotalComments() - decrement));
        postRepository.save(post);

        likeRepository.deleteByTargetTypeAndTargetId(LikeTargetType.COMMENT, commentId);
        mentionRepository.deleteByTargetTypeAndTargetId(MentionTargetType.COMMENT, commentId);

        commentRepository.delete(comment);
    }

    // ==============================
    // MAP COMMENT PAGE
    // ==============================
    private PageResponse<CommentResponse> mapCommentPageWithLikeInfo(Page<Comment> page, User currentUser) {
        List<Comment> comments = page.getContent();
        List<String> commentIds = comments.stream()
                .map(Comment::getId)
                .toList();

        Set<String> likedIds;

        if (!commentIds.isEmpty() && currentUser != null) {
            List<Like> likes = likeRepository.findByUserAndTargetTypeAndTargetIdIn(
                    currentUser,
                    LikeTargetType.COMMENT,
                    commentIds
            );
            likedIds = likes.stream()
                    .map(Like::getTargetId)
                    .collect(Collectors.toSet());
        } else {
            likedIds = Collections.emptySet();
        }

        Page<CommentResponse> dtoPage = page.map(c -> {
            boolean likedByCurrentUser = likedIds.contains(c.getId());
            return mapToCommentResponse(c, likedByCurrentUser);
        });

        return PageResponse.of(dtoPage);
    }

    // ==============================
    // MAP COMMENT -> DTO
    // ==============================
    private CommentResponse mapToCommentResponse(Comment comment, boolean likedByCurrentUser) {
        User author = comment.getAuthor();

        String avatarUrl = null;
        if (author.getProfile() != null) {
            avatarUrl = author.getProfile().getAvatar();
        }

        PostLikeUserResponse authorDto = new PostLikeUserResponse();
        authorDto.setId(author.getId());
        authorDto.setUsername(author.getUsername());
        authorDto.setAvatar(avatarUrl);

        String parentId = comment.getParentComment() != null
                ? comment.getParentComment().getId()
                : null;

        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .author(authorDto)
                .text(comment.getText())
                .totalLike(comment.getTotalLikes())
                .totalReply(comment.getTotalReply())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .parentCommentId(parentId)
                .mentions(Collections.emptyList())
                .isLikedByCurrentUser(likedByCurrentUser)
                .pinned(comment.isPinned())
                .isAuthorCommentedPost(comment.getAuthor().getId().equals(comment.getPost().getAuthor().getId()))
                .build();
    }

    // ==============================
    // SYNC MENTIONS + NOTI TAG
    // ==============================
    private void syncMentionsForComment(
            Comment comment,
            String text,
            String createdByUserId
    ) {
        String commentId = comment.getId();

        // Xoá mentions cũ
        mentionRepository.deleteByTargetTypeAndTargetId(MentionTargetType.COMMENT, commentId);

        List<String> usernames = mentionUtil.extractMentionUsernames(text);
        if (usernames.isEmpty()) {
            return;
        }

        List<User> users = userRepository.findByUsernameIn(usernames);
        if (users.isEmpty()) {
            return;
        }

        List<Mention> mentions = users.stream()
                .map(u -> Mention.builder()
                        .targetType(MentionTargetType.COMMENT)
                        .targetId(commentId)
                        .mentionedUserId(u.getId())
                        .createdByUserId(createdByUserId)
                        .build())
                .toList();

        mentionRepository.saveAll(mentions);

        Post post = comment.getPost();
        if (post == null) return;

        for (User u : users) {
            if (!u.getId().equals(createdByUserId)) {
                notificationService.createTagInCommentNotification(
                        u.getId(),
                        post.getId(),
                        commentId
                );
            }
        }
    }
}
