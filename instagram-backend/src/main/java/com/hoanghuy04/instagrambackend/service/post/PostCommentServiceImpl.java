package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.request.CommentCreateRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentLikeToggleResponse;
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
import java.util.stream.Collectors;

/**
 * Implementation of PostCommentService.
 */
@Service
@RequiredArgsConstructor
public class PostCommentServiceImpl implements PostCommentService {

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

        Comment comment = Comment.builder()
                .post(post)
                .author(currentUser)
                .text(request.getText().trim())
                .parentComment(parent)
                .mention(request.getMention())
                .totalLikes(0)
                .totalReply(0)
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

        Page<Comment> page = commentRepository
                .findByPostAndParentCommentIsNull(post, pageable);

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

        Page<Comment> page = commentRepository
                .findByPostAndParentComment(post, parent, pageable);

        return mapCommentPageWithLikeInfo(page, currentUser);
    }

    @Transactional
    @Override
    public CommentLikeToggleResponse toggleLikeComment(String postId, String commentId) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getPost().getId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
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
                .commentId(commentId)
                .liked(liked)
                .postId(postId)
                .totalLikes(comment.getTotalLikes())
                .build();
    }

    @Transactional
    @Override
    public void deleteComment(String postId, String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        Post post = comment.getPost();
        if (post == null || !post.getId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
        }

        User currentUser = securityUtil.getCurrentUser();

        boolean isOwnerOfComment = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isOwnerOfPost = post.getAuthor().getId().equals(currentUser.getId());

        if (!isOwnerOfComment && !isOwnerOfPost) {
            throw new RuntimeException("You do not have permission to delete this comment");
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
                .mention(comment.getMention())
                .isLikedByCurrentUser(likedByCurrentUser)
                .build();
    }
}
