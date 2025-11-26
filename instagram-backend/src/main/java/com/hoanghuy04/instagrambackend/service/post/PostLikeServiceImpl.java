package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeToggleResponse;
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
import com.hoanghuy04.instagrambackend.service.notification.NotificationService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;


@Service
@RequiredArgsConstructor
public class PostLikeServiceImpl implements PostLikeService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final SecurityUtil securityUtil;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    private final com.hoanghuy04.instagrambackend.repository.UserRepository userRepository;

    @Transactional
    @Override
    public PostLikeToggleResponse toggleLikePost(String postId) {
        User currentUser = securityUtil.getCurrentUser();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        Optional<Like> existing = likeRepository.findByUserAndTargetTypeAndTargetId(
                currentUser,
                LikeTargetType.POST,
                postId
        );

        boolean liked;
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            post.setTotalLikes(Math.max(0, post.getTotalLikes() - 1));
            liked = false;
        } else {
            Like like = Like.builder()
                    .user(currentUser)
                    .targetType(LikeTargetType.POST)
                    .targetId(postId)
                    .build();

            likeRepository.save(like);
            post.setTotalLikes(post.getTotalLikes() + 1);
            liked = true;

            // 🔔 noti cho chủ bài viết khi được like (trừ tự like)
            User postAuthor = post.getAuthor();
            if (postAuthor != null && !postAuthor.getId().equals(currentUser.getId())) {
                notificationService.createLikePostNotification(
                        postAuthor.getId(),
                        post.getId()
                );
            }
        }

        postRepository.save(post);

        return PostLikeToggleResponse.builder()
                .postId(postId)
                .liked(liked)
                .build();
    }

    @Transactional
    @Override
    public PageResponse<PostLikeUserResponse> getPostLikes(String postId, String query, Pageable pageable) {
        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post not found");
        }

        Page<Like> likePage;

        if (query != null && !query.trim().isEmpty()) {
            var users = userRepository.findByUsernameContainingIgnoreCase(query.trim());
            if (users.isEmpty()) {
                return PageResponse.of(Page.empty(pageable));
            }
            likePage = likeRepository.findByTargetTypeAndTargetIdAndUserIn(
                    LikeTargetType.POST,
                    postId,
                    users,
                    pageable
            );
        } else {
            likePage = likeRepository.findByTargetTypeAndTargetId(
                    LikeTargetType.POST,
                    postId,
                    pageable
            );
        }

        Page<PostLikeUserResponse> dtoPage = likePage.map(like -> {
            User user = like.getUser();

            String avatarUrl = null;
            if (user.getProfile() != null) {
                avatarUrl = user.getProfile().getAvatar();
            }

            PostLikeUserResponse dto = new PostLikeUserResponse();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setAvatar(avatarUrl);

            return dto;
        });

        return PageResponse.of(dtoPage);
    }


    private PostLikeUserResponse mapUserToPostLikeUserResponse(User user) {
        String avatarUrl = null;

        if (user != null) {
            avatarUrl = user.getProfile().getAvatar();
        }

        PostLikeUserResponse dto = new PostLikeUserResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setAvatar(avatarUrl);

        return dto;
    }
}
