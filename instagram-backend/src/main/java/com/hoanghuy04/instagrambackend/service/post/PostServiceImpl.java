package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryResponse;
import com.hoanghuy04.instagrambackend.mapper.UserMapper;
import com.hoanghuy04.instagrambackend.entity.*;
import com.hoanghuy04.instagrambackend.enums.LikeTargetType;
import com.hoanghuy04.instagrambackend.enums.PostType;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.*;
import com.hoanghuy04.instagrambackend.service.FileService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final UserService userService;
    private final UserMapper userMapper;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final FileService fileService;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final MediaFileRepository mediaFileRepository;
    private final SecurityUtil securityUtil;

    @Transactional
    @Override
    public PostResponse createPost(CreatePostRequest request) {
        User author = securityUtil.getCurrentUser();

        Post post = Post.builder()
                .author(author)
                .caption(request.getCaption())
                .type(request.getType())
                .mediaFileIds(request.getMediaFileIds())
                .tags(request.getTags())
                .location(request.getLocation())
                .totalLikes(0)
                .totalComments(0)
                .build();

        post = postRepository.save(post);
        log.info("Post created successfully: {}", post.getId());

        return convertToPostResponse(post);
    }

    @Transactional(readOnly = true)
    @Override
    public PostResponse getPost(String postId) {
        log.debug("Getting post by ID: {}", postId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        return convertToPostResponse(post);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getAllPosts(Pageable pageable) {
        log.debug("Getting all posts");

        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(this::convertToPostResponse);

        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getUserPosts(String userId, Pageable pageable) {
        log.debug("Getting posts for user: {}", userId);

        Page<PostResponse> page = postRepository.findByAuthorId(userId, pageable)
                .map(this::convertToPostResponse);

        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getFeedPosts(Pageable pageable) {
        String userId = securityUtil.getCurrentUserId();
        log.debug("Getting feed posts for user: {}", userId);

        User currentUser = securityUtil.getCurrentUser();
        Page<Post> postPage = postRepository.findAll(pageable);

        return getPostResponsePageResponse(currentUser, postPage);
    }

    private PageResponse<PostResponse> getPostResponsePageResponse(User currentUser, Page<Post> postPage) {
        Set<String> likedPostIds;

        if (currentUser != null && !postPage.isEmpty()) {
            List<String> postIds = postPage
                    .getContent()
                    .stream()
                    .map(Post::getId)
                    .collect(Collectors.toList());

            List<Like> likes = likeRepository.findByUserAndTargetTypeAndTargetIdIn(
                    currentUser,
                    LikeTargetType.POST,
                    postIds
            );

            likedPostIds = likes.stream()
                    .map(Like::getTargetId)
                    .collect(Collectors.toSet());
        } else {
            likedPostIds = Collections.emptySet();
        }

        Page<PostResponse> dtoPage = postPage.map(post -> {
            boolean liked = currentUser != null && likedPostIds.contains(post.getId());
            PostResponse dto = convertToPostResponse(post);
            dto.setLikedByCurrentUser(liked);
            return dto;
        });

        return PageResponse.of(dtoPage);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getPostsByType(PostType type, Pageable pageable) {
        Page<Post> postPage = postRepository.findByType(type, pageable);
        User currentUser = securityUtil.getCurrentUser();
        return getPostResponsePageResponse(currentUser, postPage);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getExplore(Pageable pageable) {
        log.debug("Getting explore posts");

        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(this::convertToPostResponse);

        return PageResponse.of(page);
    }

    @Transactional
    @Override
    public PostResponse updatePost(String postId, CreatePostRequest request) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Updating post: {}", postId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

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

    @Transactional
    @Override
    public void deletePost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User current = securityUtil.getCurrentUser();
        boolean owner = post.getAuthor() != null
                && post.getAuthor().getId().equals(current.getId());

        if (!owner) {
            throw new RuntimeException("You don't have permission to delete this post");
        }

        likeRepository.deleteByTargetTypeAndTargetId(LikeTargetType.POST, postId);

        List<Comment> allComments = commentRepository.findByPost_Id(postId);

        if (allComments != null && !allComments.isEmpty()) {
            List<String> commentIds = allComments.stream()
                    .map(Comment::getId)
                    .collect(Collectors.toList());

            likeRepository.deleteByTargetTypeAndTargetIdIn(
                    LikeTargetType.COMMENT,
                    commentIds
            );

            commentRepository.deleteAll(allComments);
        }

        List<String> mediaIds = post.getMediaFileIds();

        if (mediaIds != null && !mediaIds.isEmpty()) {
            List<MediaFile> medias = mediaFileRepository.findAllById(mediaIds);

            medias.forEach(media -> fileService.deleteFile(media.getId()));
        }

        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    @Override
    public Post getPostEntityById(String postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
    }

    /**
     * Convert Post -> PostResponse
     * Và set luôn author.followingByCurrentUser dựa trên currentUser + Follow.
     */
    private PostResponse convertToPostResponse(Post post) {
        User author = post.getAuthor();
        boolean following = false;

        try {
            User current = securityUtil.getCurrentUser();

            if (current != null && author != null && !current.getId().equals(author.getId())) {
                // ĐÃ ĐỔI: dùng existsByFollowerIdAndFollowingId thay cho findByFollowerAndFollowing
                following = followRepository.existsByFollowerIdAndFollowingId(
                        current.getId(),
                        author.getId()
                );
            }
        } catch (Exception e) {
            following = false;
        }

        UserSummaryResponse authorSummary = userMapper.toUserSummary(author, following);

        List<MediaFileResponse> mediaWithUrls =
                fileService.getMediaFileResponses(post.getMediaFileIds());

        return PostResponse.builder()
                .id(post.getId())
                .author(authorSummary)
                .caption(post.getCaption())
                .type(post.getType())
                .media(mediaWithUrls)
                .totalComment(post.getTotalComments())
                .totalLike(post.getTotalLikes())
                .tags(post.getTags())
                .location(post.getLocation())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
