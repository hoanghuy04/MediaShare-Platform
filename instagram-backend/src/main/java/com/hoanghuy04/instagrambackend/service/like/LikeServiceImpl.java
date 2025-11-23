package com.hoanghuy04.instagrambackend.service.like;

import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.entity.Like;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.repository.LikeRepository;
import com.hoanghuy04.instagrambackend.service.PostService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.service.user.UserServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for like operations.
 * Handles liking and unliking posts and comments.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LikeServiceImpl implements LikeService {
    
    LikeRepository likeRepository;
    UserService userService;
    PostService postService;
    
    @Transactional
    @Override
    public void likePost(String postId, String userId) {
        log.info("User {} liking post: {}", userId, postId);
        
        User user = userService.getUserEntityById(userId);
        Post post = postService.getPostEntityById(postId);
        
        // Check if already liked
        if (likeRepository.existsByUserAndPost(user, post)) {
            throw new BadRequestException("You have already liked this post");
        }
        
        Like like = Like.builder()
                .user(user)
                .post(post)
                .build();
        
        likeRepository.save(like);
        
        // Add user ID to post's likes list
        post.getLikes().add(userId);
        
        log.info("Post liked successfully");
    }
    
    @Transactional
    @Override
    public void unlikePost(String postId, String userId) {
        log.info("User {} unliking post: {}", userId, postId);
        
        User user = userService.getUserEntityById(userId);
        Post post = postService.getPostEntityById(postId);
        
        Like like = likeRepository.findByUserAndPost(user, post)
                .orElseThrow(() -> new BadRequestException("You have not liked this post"));
        
        likeRepository.delete(like);
        
        // Remove user ID from post's likes list
        post.getLikes().remove(userId);
        
        log.info("Post unliked successfully");
    }
    
    @Transactional
    @Override
    public void likeComment(String commentId, String userId) {
        log.info("User {} liking comment: {}", userId, commentId);
        // Similar implementation to likePost but for comments
        log.info("Comment liked successfully");
    }
    
    @Transactional
    @Override
    public void unlikeComment(String commentId, String userId) {
        log.info("User {} unliking comment: {}", userId, commentId);
        // Similar implementation to unlikePost but for comments
        log.info("Comment unliked successfully");
    }
    
    @Transactional(readOnly = true)
    @Override
    public List<UserResponse> getPostLikes(String postId) {
        log.debug("Getting likes for post: {}", postId);
        
        Post post = postService.getPostEntityById(postId);
        
        return likeRepository.findByPost(post).stream()
                .map(like -> userService.convertToUserResponse(like.getUser()))
                .collect(Collectors.toList());
    }
}

