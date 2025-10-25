package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.Media;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Paths;
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
    private final FileStorageService fileStorageService;
    
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
        
        // Convert media file paths to URLs
        List<Media> mediaWithUrls = convertMediaPathsToUrls(request.getMedia());
        
        Post post = Post.builder()
                .author(author)
                .caption(request.getCaption())
                .media(mediaWithUrls)
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
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getAllPosts(Pageable pageable, String currentUserId) {
        log.debug("Getting all posts");
        
        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(post -> convertToPostResponse(post, currentUserId));
        
        return PageResponse.of(page);
    }
    
    /**
     * Get posts by user.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @param currentUserId the current user ID (optional)
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getUserPosts(String userId, Pageable pageable, String currentUserId) {
        log.debug("Getting posts for user: {}", userId);
        
        Page<PostResponse> page = postRepository.findByAuthorId(userId, pageable)
                .map(post -> convertToPostResponse(post, currentUserId));
        
        return PageResponse.of(page);
    }
    
    /**
     * Get feed posts for user (posts from followed users).
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getFeedPosts(String userId, Pageable pageable) {
        log.debug("Getting feed posts for user: {}", userId);
        
        User user = userService.getUserEntityById(userId);
        
//        List<String> followingIds = followRepository.findByFollower(user).stream()
//                .map(follow -> follow.getFollowing().getId())
//                .collect(Collectors.toList());
//
//        followingIds.add(userId);
//
//        Page<PostResponse> page = postRepository.findByAuthorIdIn(followingIds, pageable)
//                .map(post -> convertToPostResponse(post, userId));
        //get All posts and prioritize posts from followed users
        List<String> followingIds = followRepository.findByFollower(user).stream()
                .map(follow -> follow.getFollowing().getId())
                .collect(Collectors.toList());
        followingIds.add(userId);
        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(post -> {
                    PostResponse postResponse = convertToPostResponse(post, userId);
                    if (followingIds.contains(post.getAuthor().getId())) {
                        // Boost posts from followed users
                        postResponse = PostResponse.builder()
                                .id(postResponse.getId())
                                .author(postResponse.getAuthor())
                                .caption(postResponse.getCaption())
                                .media(postResponse.getMedia())
                                .likesCount(postResponse.getLikesCount())
                                .commentsCount(postResponse.getCommentsCount())
                                .tags(postResponse.getTags())
                                .location(postResponse.getLocation())
                                .isLikedByCurrentUser(postResponse.isLikedByCurrentUser())
                                .createdAt(postResponse.getCreatedAt())
                                .updatedAt(postResponse.getUpdatedAt())
                                .build();
                    }
                    return postResponse;
                });
        return PageResponse.of(page);
    }
    
    /**
     * Get explore posts (random/popular posts).
     *
     * @param pageable pagination information
     * @param currentUserId the current user ID (optional)
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getExplore(Pageable pageable, String currentUserId) {
        log.debug("Getting explore posts");
        
        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(post -> convertToPostResponse(post, currentUserId));
        
        return PageResponse.of(page);
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
        
        // Convert media file paths to URLs
        List<Media> mediaWithUrls = convertMediaPathsToUrls(request.getMedia());
        
        post.setCaption(request.getCaption());
        post.setMedia(mediaWithUrls);
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
     * Like a post.
     *
     * @param postId the post ID
     * @param userId the user ID liking the post
     */
    @Transactional
    public void likePost(String postId, String userId) {
        log.info("Liking post: {} by user: {}", postId, userId);
        
        Post post = getPostEntityById(postId);
        
        if (post.getLikes() == null) {
            post.setLikes(new ArrayList<>());
        }
        
        if (!post.getLikes().contains(userId)) {
            post.getLikes().add(userId);
            postRepository.save(post);
            log.info("Post liked successfully");
        }
    }
    
    /**
     * Unlike a post.
     *
     * @param postId the post ID
     * @param userId the user ID unliking the post
     */
    @Transactional
    public void unlikePost(String postId, String userId) {
        log.info("Unliking post: {} by user: {}", postId, userId);
        
        Post post = getPostEntityById(postId);
        
        if (post.getLikes() != null && post.getLikes().contains(userId)) {
            post.getLikes().remove(userId);
            postRepository.save(post);
            log.info("Post unliked successfully");
        }
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
    
    /**
     * Convert media file paths to URLs.
     *
     * @param mediaList the list of media objects
     * @return list of media objects with URLs
     */
    private List<Media> convertMediaPathsToUrls(List<Media> mediaList) {
        if (mediaList == null || mediaList.isEmpty()) {
            return new ArrayList<>();
        }
        
        return mediaList.stream()
                .map(this::convertMediaPathToUrl)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert a single media file path to URL.
     *
     * @param media the media object
     * @return media object with URL
     */
    private Media convertMediaPathToUrl(Media media) {
        if (media == null || media.getUrl() == null) {
            return media;
        }
        
        String url = media.getUrl();
        
        // If URL is already a full URL (starts with http), return as is
        if (url.startsWith("http")) {
            return media;
        }
        
        // If URL is a relative path, convert to full URL
        String filename = Paths.get(url).getFileName().toString();
        String fullUrl = fileStorageService.getFileUrl(filename);
        
        return Media.builder()
                .url(fullUrl)
                .type(media.getType())
                .uploadedAt(media.getUploadedAt())
                .build();
    }
}

