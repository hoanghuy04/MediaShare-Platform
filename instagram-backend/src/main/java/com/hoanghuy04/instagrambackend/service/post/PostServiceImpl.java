package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryResponse;
import com.hoanghuy04.instagrambackend.dto.response.*;
import com.hoanghuy04.instagrambackend.mapper.UserMapper;
import com.hoanghuy04.instagrambackend.entity.*;
import com.hoanghuy04.instagrambackend.enums.LikeTargetType;
import com.hoanghuy04.instagrambackend.enums.MentionTargetType;
import com.hoanghuy04.instagrambackend.enums.PostType;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.mapper.UserMapper;
import com.hoanghuy04.instagrambackend.repository.*;
import com.hoanghuy04.instagrambackend.service.FileService;
import com.hoanghuy04.instagrambackend.service.hashtag.HashtagService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.util.MentionUtil;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final UserMapper userMapper;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final FileService fileService;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final MediaFileRepository mediaFileRepository;
    private final UserRepository userRepository;
    private final MentionRepository mentionRepository;
    private final SecurityUtil securityUtil;
    private final MentionUtil mentionUtil;
    private final HashtagService hashtagService;
    private final HashtagRepository hashtagRepository;

    @Transactional
    @Override
    public PostResponse createPost(CreatePostRequest request) {
        User author = securityUtil.getCurrentUser();

        List<Hashtag> tags = new ArrayList<>();
        for (String rawTag : request.getTags()) {
            String tag = rawTag.trim().toLowerCase();
            if (tag.isEmpty()) continue;
            hashtagService.increaseUsage(tag);
            Hashtag hashtag = hashtagRepository.findByTag(tag)
                    .orElseThrow(() -> new RuntimeException("Failed to load hashtag"));
            tags.add(hashtag);
        }

        Post post = Post.builder()
                .author(author)
                .caption(request.getCaption())
                .type(request.getType())
                .mediaFileIds(request.getMediaFileIds())
                .tags(tags)
                .location(request.getLocation())
                .totalLikes(0)
                .totalComments(0)
                .build();

        post = postRepository.save(post);
        log.info("Post created successfully: {}", post.getId());

        syncMentions(MentionTargetType.POST, post.getId(), request.getCaption(), author.getId());

        return convertToPostResponse(post);
    }

    @Transactional(readOnly = true)
    @Override
    public PostResponse getPost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        return convertToPostResponse(post);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getAllPosts(Pageable pageable) {
        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(this::convertToPostResponse);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getUserPosts(String userId, Pageable pageable) {

        User currentUser = null;
        try {
            currentUser = securityUtil.getCurrentUser();
        } catch (Exception ignored) {}

        Page<Post> postPage = postRepository.findByAuthorId(userId, pageable);

        return buildPostResponsePage(currentUser, postPage);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getFeedPosts(Pageable pageable) {
        User currentUser = securityUtil.getCurrentUser();
        Page<Post> postPage = postRepository.findAll(pageable);
        return buildPostResponsePage(currentUser, postPage);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getPostsByType(PostType type, Pageable pageable) {
        User currentUser = securityUtil.getCurrentUser();
        Page<Post> postPage = postRepository.findByType(type, pageable);
        return buildPostResponsePage(currentUser, postPage);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostResponse> getExplore(Pageable pageable) {
        Page<PostResponse> page = postRepository.findAll(pageable)
                .map(this::convertToPostResponse);
        return PageResponse.of(page);
    }

    @Transactional
    @Override
    public PostResponse updatePost(String postId, CreatePostRequest request) {
        String userId = securityUtil.getCurrentUserId();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to update this post");
        }

        List<Hashtag> newTags = new ArrayList<>();

        for (String rawTag : request.getTags()) {
            String cleanTag = rawTag.trim().toLowerCase();
            if (cleanTag.isEmpty()) continue;
            hashtagService.increaseUsage(cleanTag);
            Hashtag tagEntity = hashtagRepository.findByTag(cleanTag)
                    .orElseThrow(() -> new RuntimeException("Failed to load hashtag: " + cleanTag));

            newTags.add(tagEntity);
        }

        post.setCaption(request.getCaption());
        post.setType(request.getType());
        post.setMediaFileIds(request.getMediaFileIds());
        post.setTags(newTags);
        post.setLocation(request.getLocation());

        post = postRepository.save(post);

        syncMentions(MentionTargetType.POST, postId, request.getCaption(), userId);

        return convertToPostResponse(post);
    }


    @Transactional
    @Override
    public void deletePost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User current = securityUtil.getCurrentUser();

        if (!post.getAuthor().getId().equals(current.getId())) {
            throw new UnauthorizedException("You don't have permission to delete this post");
        }

        likeRepository.deleteByTargetTypeAndTargetId(LikeTargetType.POST, postId);

        List<Comment> allComments = commentRepository.findByPost_Id(postId);
        if (!allComments.isEmpty()) {
            List<String> commentIds = allComments.stream().map(Comment::getId).toList();

            likeRepository.deleteByTargetTypeAndTargetIdIn(LikeTargetType.COMMENT, commentIds);

            // delete mentions inside comments
            commentIds.forEach(id ->
                    mentionRepository.deleteByTargetTypeAndTargetId(MentionTargetType.COMMENT, id)
            );

            commentRepository.deleteAll(allComments);
        }

        // delete post mentions
        mentionRepository.deleteByTargetTypeAndTargetId(MentionTargetType.POST, postId);

        // delete media
        List<MediaFile> medias = mediaFileRepository.findAllById(post.getMediaFileIds());
        medias.forEach(media -> fileService.deleteFile(media.getId()));

        postRepository.delete(post);
    }

    // ==============================
    // GET POST ENTITY
    // ==============================
    @Transactional(readOnly = true)
    @Override
    public Post getPostEntityById(String postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
    }

    // ==============================
    // CONVERT TO DTO
    // ==============================
    private PostResponse convertToPostResponse(Post post) {
        User author = post.getAuthor();
        boolean following = false;

        try {
            User current = securityUtil.getCurrentUser();

            if (current != null && !current.getId().equals(author.getId())) {
                following = followRepository.existsByFollowerIdAndFollowingId(
                        current.getId(),
                        author.getId()
                );
            }

        } catch (Exception ignored) {}

        List<HashtagResponse> hashtagResponses = post.getTags()
                .stream()
                .map(tag -> HashtagResponse.builder()
                        .id(tag.getId())
                        .tag(tag.getTag())
                        .usageCount(tag.getUsageCount())
                        .build()
                ).toList();

        UserSummaryResponse authorSummary = userMapper.toUserSummary(author, following);
        List<MediaFileResponse> media = fileService.getMediaFileResponses(post.getMediaFileIds());

        return PostResponse.builder()
                .id(post.getId())
                .author(authorSummary)
                .caption(post.getCaption())
                .type(post.getType())
                .media(media)
                .totalComment(post.getTotalComments())
                .totalLike(post.getTotalLikes())
                .tags(hashtagResponses)
                .location(post.getLocation())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private void syncMentions(
            MentionTargetType targetType,
            String targetId,
            String caption,
            String createdByUserId
    ) {
        // Remove old mentions
        mentionRepository.deleteByTargetTypeAndTargetId(targetType, targetId);

        List<String> usernames = mentionUtil.extractMentionUsernames(caption);
        if (usernames.isEmpty()) {
            return;
        }

        List<User> users = userRepository.findByUsernameIn(usernames);
        if (users.isEmpty()) {
            return;
        }

        List<Mention> mentions = users.stream()
                .map(u -> Mention.builder()
                        .targetType(targetType)
                        .targetId(targetId)
                        .createdByUserId(createdByUserId)
                        .mentionedUserId(u.getId())
                        .build())
                .toList();

        mentionRepository.saveAll(mentions);
    }

    private PageResponse<PostResponse> buildPostResponsePage(User currentUser, Page<Post> page) {
        Set<String> likedPostIds = currentUser != null
                ? likeRepository.findByUserAndTargetTypeAndTargetIdIn(
                currentUser,
                LikeTargetType.POST,
                page.stream().map(Post::getId).toList()
        ).stream().map(Like::getTargetId).collect(Collectors.toSet())
                : Collections.emptySet();

        Page<PostResponse> dtoPage = page.map(post -> {
            PostResponse dto = convertToPostResponse(post);
            dto.setLikedByCurrentUser(likedPostIds.contains(post.getId()));
            return dto;
        });

        return PageResponse.of(dtoPage);
    }
}
