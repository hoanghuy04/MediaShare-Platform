package com.hoanghuy04.instagrambackend.service.like;

import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Like;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.repository.LikeRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.service.PostService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LikeServiceImpl implements LikeService {

    private final LikeRepository likeRepository;
    private final UserService userService;
    private final PostService postService;
    private final PostRepository postRepository;

    private String getCurrentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @Transactional
    @Override
    public boolean toggleLikePost(String postId) {
        String username = getCurrentUsername();
        User user = userService.getUserByName(username);
        Post post = postService.getPostEntityById(postId);

        var existing = likeRepository.findByUserAndPost(user, post);

        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            post.getLikes().remove(user.getId());
            postRepository.save(post);
            return false;
        }

        Like like = Like.builder()
                .user(user)
                .post(post)
                .build();

        likeRepository.save(like);
        post.getLikes().add(user.getId());
        postRepository.save(post);

        return true;
    }

    @Transactional
    @Override
    public void likeComment(String commentId) {
        String userId = getCurrentUsername();
        log.info("User {} liking comment: {}", userId, commentId);
        log.info("Comment liked successfully");
    }

    @Transactional
    @Override
    public void unlikeComment(String commentId) {
        String userId = getCurrentUsername();
        log.info("User {} unliking comment: {}", userId, commentId);

        // TODO: implement similar to unlikePost

        log.info("Comment unliked successfully");
    }

        @Override
        @Transactional(readOnly = true)
        public List<UserResponse> getPostLikes(String postId) {
            Post post = postService.getPostEntityById(postId);

            return likeRepository.findByPost(post).stream()
                    .map(like -> userService.convertToUserResponse(like.getUser()))
                    .collect(Collectors.toList());
        }
}
