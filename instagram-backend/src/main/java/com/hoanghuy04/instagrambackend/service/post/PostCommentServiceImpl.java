package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.request.CommentCreateRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentLikeToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentPinToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeUserResponse;
import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Like;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.LikeTargetType;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.CommentRepository;
import com.hoanghuy04.instagrambackend.repository.LikeRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostCommentServiceImpl implements PostCommentService {

    private static final int MAX_PINNED_COMMENTS = 2;

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final SecurityUtil securityUtil;


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
        List<String> mentions = extractMentions(rawText);

        Comment comment = Comment.builder()
                .post(post)
                .author(currentUser)
                .text(rawText)
                .parentComment(parent)
                .mentions(mentions)
                .totalLikes(0L)
                .totalReply(0L)
                .pinned(false)
                .build();

        Comment saved = commentRepository.save(comment);

        post.setTotalComments(post.getTotalComments() + 1);
        postRepository.save(post);

        return mapToCommentResponse(saved, false);
    }


    @Transactional(readOnly = true)
    @Override
    public PageResponse<CommentResponse> getComments(String postId, Pageable pageable) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User currentUser = securityUtil.getCurrentUser();

        Page<Comment> page = commentRepository.findByPostAndParentCommentIsNull(post, pageable);

        return mapCommentPageWithLikeInfo(page, currentUser);
    }

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
        }

        commentRepository.save(comment);

        return CommentLikeToggleResponse.builder()
                .postId(postId)
                .commentId(commentId)
                .liked(liked)
                .totalLikes(comment.getTotalLikes())
                .build();
    }


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

            for (Comment reply : replies) {
                likeRepository.deleteByTargetTypeAndTargetId(
                        LikeTargetType.COMMENT,
                        reply.getId()
                );
            }

            commentRepository.deleteAll(replies);
            decrement += replies.size();
        } else {
            Comment parent = comment.getParentComment();
            parent.setTotalReply(Math.max(0, parent.getTotalReply() - 1));
            commentRepository.save(parent);
        }

        post.setTotalComments(Math.max(0, post.getTotalComments() - decrement));
        postRepository.save(post);

        likeRepository.deleteByTargetTypeAndTargetId(
                LikeTargetType.COMMENT,
                commentId
        );

        commentRepository.delete(comment);
    }

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

    private CommentResponse mapToCommentResponse(Comment comment, boolean likedByCurrentUser) {
        User author = comment.getAuthor();

        String avatarUrl = null;
        if (author.getProfile() != null) {
            avatarUrl = author.getProfile().getAvatar();
        }

        PostLikeUserResponse authorDto = new PostLikeUserResponse();
        authorDto.setId(author.getId());
        authorDto.setUsername(author.getUsername());
        authorDto.setAvatarUrl(avatarUrl);

        String parentId = comment.getParentComment() != null
                ? comment.getParentComment().getId()
                : null;

        List<String> mentions = comment.getMentions() != null
                ? comment.getMentions()
                : Collections.emptyList();

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
                .mentions(mentions)
                .isLikedByCurrentUser(likedByCurrentUser)
                .pinned(comment.isPinned())
                .isAuthorCommentedPost(comment.getAuthor().getId().equals(comment.getPost().getAuthor().getId()))
                .build();
    }

    private List<String> extractMentions(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyList();
        }

        Pattern pattern = Pattern.compile("@([A-Za-z0-9_\\.]+)");
        Matcher matcher = pattern.matcher(text);

        List<String> usernames = new ArrayList<>();
        while (matcher.find()) {
            String username = matcher.group(1);
            if (username != null && !username.isBlank()) {
                usernames.add(username);
            }
        }

        return usernames;
    }
}
