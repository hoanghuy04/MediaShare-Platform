package com.hoanghuy04.instagrambackend.service.like;

import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service interface for like operations.
 * Handles liking and unliking posts and comments.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Service
public interface LikeService {

    @Transactional
    boolean toggleLikePost(String postId);

    @Transactional
    void likeComment(String commentId);

    @Transactional
    void unlikeComment(String commentId);


    @Transactional(readOnly = true)
    List<UserResponse> getPostLikes(String postId);
}
