package com.hoanghuy04.instagrambackend.service.comment;

import com.hoanghuy04.instagrambackend.dto.request.CreateCommentRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.CommentRepository;
import com.hoanghuy04.instagrambackend.service.PostService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.service.user.UserServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
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
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentServiceImpl implements CommentService {
    
    CommentRepository commentRepository;
    UserService userService;
    PostService postService;
    
    @Transactional
    @Override
    public CommentResponse createComment(CreateCommentRequest request, String userId) {
        log.info("Creating comment for post: {}", request.getPostId());
        
        User author = userService.getUserEntityById(userId);
        Post post = postService.getPostEntityById(request.getPostId());
        
        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .text(request.getText())
                .build();
        
        comment = commentRepository.save(comment);
        
        // Add comment ID to post's comments list
        post.getComments().add(comment.getId());
        
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
    
    @Transactional(readOnly = true)
    @Override
    public PageResponse<CommentResponse> getPostComments(String postId, Pageable pageable) {
        log.debug("Getting comments for post: {}", postId);
        
        Page<CommentResponse> page = commentRepository.findByPostId(postId, pageable)
                .map(this::convertToCommentResponse);
        
        return PageResponse.of(page);
    }
    
    @Transactional
    @Override
    public CommentResponse updateComment(String commentId, String text, String userId) {
        log.info("Updating comment: {}", commentId);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        // Check if user is the author
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to update this comment");
        }
        
        comment.setText(text);
        comment = commentRepository.save(comment);
        
        log.info("Comment updated successfully: {}", commentId);
        
        return convertToCommentResponse(comment);
    }
    
    @Transactional
    @Override
    public void deleteComment(String commentId, String userId) {
        log.info("Deleting comment: {}", commentId);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        // Check if user is the author
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to delete this comment");
        }
        
        commentRepository.delete(comment);
        log.info("Comment deleted successfully: {}", commentId);
    }
    
    @Transactional
    @Override
    public CommentResponse replyToComment(String commentId, CreateCommentRequest request, String userId) {
        log.info("Creating reply to comment: {}", commentId);
        
        Comment parentComment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        CommentResponse reply = createComment(request, userId);
        
        // Add reply ID to parent comment's replies list
        parentComment.getReplies().add(reply.getId());
        commentRepository.save(parentComment);
        
        log.info("Reply created successfully");
        
        return reply;
    }
    
    @Transactional
    @Override
    public void likeComment(String commentId, String userId) {
        log.info("Liking comment: {} by user: {}", commentId, userId);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        if (comment.getLikes() == null) {
            comment.setLikes(new ArrayList<>());
        }
        
        if (!comment.getLikes().contains(userId)) {
            comment.getLikes().add(userId);
            commentRepository.save(comment);
            log.info("Comment liked successfully");
        }
    }
    
    @Transactional
    @Override
    public void unlikeComment(String commentId, String userId) {
        log.info("Unliking comment: {} by user: {}", commentId, userId);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        if (comment.getLikes() != null && comment.getLikes().contains(userId)) {
            comment.getLikes().remove(userId);
            commentRepository.save(comment);
            log.info("Comment unliked successfully");
        }
    }
    
    private CommentResponse convertToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .author(userService.convertToUserResponse(comment.getAuthor()))
                .text(comment.getText())
                .likesCount(comment.getLikes() != null ? comment.getLikes().size() : 0)
                .repliesCount(comment.getReplies() != null ? comment.getReplies().size() : 0)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}

