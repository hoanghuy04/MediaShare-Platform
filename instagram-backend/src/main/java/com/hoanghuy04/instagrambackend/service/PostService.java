package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for post operations.
 * Handles post creation, updates, and queries.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {
    
    private final PostRepository postRepository;
    private final UserService userService;
    private final FollowRepository followRepository;
    
    /**
     * Create a new post.
     *
     * @param request the post creation request
     * @param userId the user ID creating the post
     * @return PostResponse
     */
    @Transactional
    public PostResponse createPost(CreatePostRequest request, String userId) {
        log.info("Creating post for user: {}", userId);
        
        User author = userService.getUserEntityById(userId);
        
        Post post = Post.builder()
                .author(author)
                .caption(request.getCaption())
                .media(request.getMedia())
                .tags(request.getTags())
                .location(request.getLocation())
                .likes(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();
        
        post = postRepository.save(post);
        log.info("Post created successfully: {}", post.getId());
        
        return convertToPostResponse(post, userId);
    }
    
    /**
     * Get post by ID.
     *
     * @param postId the post ID
     * @param currentUserId the current user ID (optional)
     * @return PostResponse
     */
    @Transactional(readOnly = true)
    public PostResponse getPost(String postId, String currentUserId) {
        log.debug("Getting post by ID: {}", postId);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        return convertToPostResponse(post, currentUserId);
    }
    
    /**
     * Get all posts with pagination.
     *
     * @param pageable pagination information
     * @param currentUserId the current user ID (optional)
     * @return Page of PostResponse
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getAllPosts(Pageable pageable, String currentUserId) {
        log.debug("Getting all posts");
        
        return postRepository.findAll(pageable)
                .map(post -> convertToPostResponse(post, currentUserId));
    }
    
    /**
     * Get posts by user.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @param currentUserId the current user ID (optional)
     * @return Page of PostResponse
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getUserPosts(String userId, Pageable pageable, String currentUserId) {
        log.debug("Getting posts for user: {}", userId);
        
        return postRepository.findByAuthorId(userId, pageable)
                .map(post -> convertToPostResponse(post, currentUserId));
    }
    
    /**
     * Get feed posts for user (posts from followed users).
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return Page of PostResponse
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getFeedPosts(String userId, Pageable pageable) {
        log.debug("Getting feed posts for user: {}", userId);
        
        User user = userService.getUserEntityById(userId);
        
        // Get list of followed user IDs
        List<String> followingIds = followRepository.findByFollower(user).stream()
                .map(follow -> follow.getFollowing().getId())
                .collect(Collectors.toList());
        
        // Include user's own posts
        followingIds.add(userId);
        
        return postRepository.findByAuthorIdIn(followingIds, pageable)
                .map(post -> convertToPostResponse(post, userId));
    }
    
    /**
     * Get explore posts (random/popular posts).
     *
     * @param pageable pagination information
     * @param currentUserId the current user ID (optional)
     * @return Page of PostResponse
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getExplore(Pageable pageable, String currentUserId) {
        log.debug("Getting explore posts");
        
        return postRepository.findAll(pageable)
                .map(post -> convertToPostResponse(post, currentUserId));
    }
    
    /**
     * Update a post.
     *
     * @param postId the post ID
     * @param request the update request
     * @param userId the user ID updating the post
     * @return updated PostResponse
     */
    @Transactional
    public PostResponse updatePost(String postId, CreatePostRequest request, String userId) {
        log.info("Updating post: {}", postId);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        // Check if user is the author
        if (!post.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to update this post");
        }
        
        post.setCaption(request.getCaption());
        post.setMedia(request.getMedia());
        post.setTags(request.getTags());
        post.setLocation(request.getLocation());
        
        post = postRepository.save(post);
        log.info("Post updated successfully: {}", postId);
        
        return convertToPostResponse(post, userId);
    }
    
    /**
     * Delete a post.
     *
     * @param postId the post ID
     * @param userId the user ID deleting the post
     */
    @Transactional
    public void deletePost(String postId, String userId) {
        log.info("Deleting post: {}", postId);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        // Check if user is the author
        if (!post.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to delete this post");
        }
        
        postRepository.delete(post);
        log.info("Post deleted successfully: {}", postId);
    }
    
    /**
     * Get post entity by ID.
     *
     * @param postId the post ID
     * @return Post entity
     */
    @Transactional(readOnly = true)
    public Post getPostEntityById(String postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
    }
    
    /**
     * Convert Post entity to PostResponse DTO.
     *
     * @param post the Post entity
     * @param currentUserId the current user ID (optional)
     * @return PostResponse DTO
     */
    private PostResponse convertToPostResponse(Post post, String currentUserId) {
        UserResponse authorResponse = userService.convertToUserResponse(post.getAuthor());
        
        boolean isLikedByCurrentUser = false;
        if (currentUserId != null && post.getLikes() != null) {
            isLikedByCurrentUser = post.getLikes().contains(currentUserId);
        }
        
        return PostResponse.builder()
                .id(post.getId())
                .author(authorResponse)
                .caption(post.getCaption())
                .media(post.getMedia())
                .likesCount(post.getLikes() != null ? post.getLikes().size() : 0)
                .commentsCount(post.getComments() != null ? post.getComments().size() : 0)
                .tags(post.getTags())
                .location(post.getLocation())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}

