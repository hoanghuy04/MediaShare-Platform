package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
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
    private final FileService fileService;
    private final SecurityUtil securityUtil;

    /**
     * Create a new post.
     *
     * @param request the post creation request
     * @return PostResponse
     */
    @Transactional
    public PostResponse createPost(CreatePostRequest request) {
        User author = securityUtil.getCurrentUser();

        Post post = Post.builder()
                .author(author)
                .caption(request.getCaption())
                .type(request.getType())
                .mediaFileIds(request.getMediaFileIds())
                .tags(request.getTags())
                .location(request.getLocation())
                .likes(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();

        post = postRepository.save(post);
        log.info("Post created successfully: {}", post.getId());

        return convertToPostResponse(post);
    }

    /**
     * Get post by ID.
     *
     * @param postId the post ID
     * @return PostResponse
     */
    @Transactional(readOnly = true)
    public PostResponse getPost(String postId) {
        log.debug("Getting post by ID: {}", postId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        return convertToPostResponse(post);
    }

    /**
     * Get all posts with pagination.
     *
     * @param pageable pagination information
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getAllPosts(Pageable pageable) {
        log.debug("Getting all posts");

        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(this::convertToPostResponse);

        return PageResponse.of(page);
    }

    /**
     * Get posts by user.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getUserPosts(String userId, Pageable pageable) {
        log.debug("Getting posts for user: {}", userId);

        Page<PostResponse> page = postRepository.findByAuthorId(userId, pageable)
                .map(this::convertToPostResponse);

        return PageResponse.of(page);
    }

    /**
     * Get feed posts for user (posts from followed users).
     *
     * @param pageable pagination information
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getFeedPosts(Pageable pageable) {
        String userId = securityUtil.getCurrentUserId();
        log.debug("Getting feed posts for user: {}", userId);

        User user = userService.getUserEntityById(userId);

        //get All posts and prioritize posts from followed users
        List<String> followingIds = followRepository.findByFollower(user).stream()
                .map(follow -> follow.getFollowing().getId())
                .collect(Collectors.toList());
        followingIds.add(userId);
        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(this::convertToPostResponse);
        return PageResponse.of(page);
    }

    /**
     * Get explore posts (random/popular posts).
     *
     * @param pageable pagination information
     * @return PageResponse of PostResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getExplore(Pageable pageable) {
        log.debug("Getting explore posts");

        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(this::convertToPostResponse);

        return PageResponse.of(page);
    }

    /**
     * Update a post.
     *
     * @param postId the post ID
     * @param request the update request
     * @return updated PostResponse
     */
    @Transactional
    public PostResponse updatePost(String postId, CreatePostRequest request) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Updating post: {}", postId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Check if user is the author
        if (!post.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to update this post");
        }

        post.setCaption(request.getCaption());
        post.setType(request.getType());
        post.setMediaFileIds(request.getMediaFileIds());
        post.setTags(request.getTags());
        post.setLocation(request.getLocation());

        post = postRepository.save(post);
        log.info("Post updated successfully: {}", postId);

        return convertToPostResponse(post);
    }

    /**
     * Delete a post.
     *
     * @param postId the post ID
     */
    @Transactional
    public void deletePost(String postId) {
        String userId = securityUtil.getCurrentUserId();
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
     */
    @Transactional
    public void likePost(String postId) {
        String userId = securityUtil.getCurrentUserId();
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
     */
    @Transactional
    public void unlikePost(String postId) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Unliking post: {} by user: {}", postId, userId);

        Post post = getPostEntityById(postId);

        if (post.getLikes() != null && post.getLikes().contains(userId)) {
            post.getLikes().remove(userId);
            postRepository.save(post);
            log.info("Post unliked successfully");
        }
    }

    /**
     * Convert Post entity to PostResponse DTO with media URLs.
     *
     * @param post the Post entity
     * @return PostResponse
     */
    private PostResponse convertToPostResponse(Post post) {
        UserResponse authorResponse = userService.convertToUserResponse(post.getAuthor());

        String currentUserId = securityUtil.getCurrentUserId();

        boolean isLikedByCurrentUser = false;
        if (currentUserId != null && post.getLikes() != null) {
            isLikedByCurrentUser = post.getLikes().contains(currentUserId);
        }

        List<MediaFileResponse> mediaWithUrls = fileService.getMediaFileResponses(post.getMediaFileIds());

        return PostResponse.builder()
                .id(post.getId())
                .author(authorResponse)
                .caption(post.getCaption())
                .type(post.getType())
                .media(mediaWithUrls)
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

