package com.hoanghuy04.instagrambackend.service.comment;

import com.hoanghuy04.instagrambackend.dto.request.CreateCommentRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Like;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.CommentRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.service.PostService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.service.user.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for comment operations.
 * Handles comment creation, updates, and queries.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {
    
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final PostService postService;
    private final PostRepository postRepository;

    private String getCurrentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @Transactional
    @Override
    public CommentResponse createComment(CreateCommentRequest request) {
        log.info("Creating comment for post: {}", request.getPostId());
        
        User author = userService.getUserByName(getCurrentUsername());
        Post post = postService.getPostEntityById(request.getPostId());
        
        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .text(request.getText())
                .build();
        
        comment = commentRepository.save(comment);
        
        post.getComments().add(comment.getId());
        postRepository.save(post);
        
        log.info("Comment created successfully: {}", comment.getId());
        
        return convertToCommentResponse(comment);
    }
    
    @Transactional(readOnly = true)
    @Override
    public CommentResponse getComment(String commentId) {
        log.debug("Getting comment by ID: {}", commentId);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        return convertToCommentResponse(comment);
    }

    @Transactional
    @Override
    public CommentResponse updateComment(String commentId, String text) {
        log.info("Updating comment: {}", commentId);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        // Check if user is the author
        if (!comment.getAuthor().getId().equals(userService.getUserByName(getCurrentUsername()).getId())) {
            throw new UnauthorizedException("You are not authorized to update this comment");
        }
        
        comment.setText(text);
        comment = commentRepository.save(comment);
        
        log.info("Comment updated successfully: {}", commentId);
        
        return convertToCommentResponse(comment);
    }
    
    @Transactional
    @Override
    public void deleteComment(String commentId) {
        log.info("Deleting comment: {}", commentId);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        // Check if user is the author
        if (!comment.getAuthor().getId().equals(userService.getUserByName(getCurrentUsername()).getId())) {
            throw new UnauthorizedException("You are not authorized to delete this comment");
        }
        
        commentRepository.delete(comment);
        log.info("Comment deleted successfully: {}", commentId);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CommentResponse> getCommentReplies(String commentId) {
        log.debug("Getting replies for comment: {}", commentId);

        return commentRepository.findByParentCommentId(commentId)
                .stream()
                .map(this::convertToCommentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<CommentResponse> getPostComments(String postId, Pageable pageable) {
        log.debug("Getting comments for post: {}", postId);

        Page<CommentResponse> page = commentRepository
                .findByPostIdAndParentCommentIdIsNull(postId, pageable)
                .map(this::convertToCommentResponse);

        return PageResponse.of(page);
    }

    @Transactional
    @Override
    public CommentResponse replyToComment(String parentCommentId, CreateCommentRequest request) {
        log.info("Creating reply to comment: {}", parentCommentId);

        User author = userService.getUserByName(getCurrentUsername());
        Comment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + parentCommentId));

        Comment reply = Comment.builder()
                .post(parentComment.getPost())
                .author(author)
                .text(request.getText())
                .parentCommentId(parentCommentId)
                .mention(request.getMention())
                .build();

        reply = commentRepository.save(reply);

        log.info("Reply created successfully with parent: {}", parentCommentId);

        return convertToCommentResponse(reply);
    }
    
    @Transactional
    @Override
    public boolean toggleLikeComment(String commentId) {
        String username = getCurrentUsername();
        User user = userService.getUserByName(username);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        var existing = comment
                .getLikes()
                .stream()
                .filter(x -> x.equals(user.getId()))
                .toList();

        if (!existing.isEmpty()) {
            comment.setLikes(comment.getLikes().stream()
                    .filter(x -> x != user.getId())
                    .toList());
            commentRepository.save(comment);
            return false;
        }

        comment.getLikes().add(user.getId());
        commentRepository.save(comment);

        return true;
    }
    
    private CommentResponse convertToCommentResponse(Comment comment) {
        String username = getCurrentUsername();
        User user = userService.getUserByName(username);
        boolean isLikedByCurrentUser = false;
        if (user != null && comment.getLikes() != null) {
            isLikedByCurrentUser = comment.getLikes().contains(user.getId());
        }
        long repliesCountLong = commentRepository.countByParentCommentId(comment.getId());
        int repliesCount = (int) repliesCountLong;
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .author(userService.convertToUserResponse(comment.getAuthor()))
                .text(comment.getText())
                .likesCount(comment.getLikes() != null ? comment.getLikes().size() : 0)
                .repliesCount(repliesCount)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .build();
    }
}

