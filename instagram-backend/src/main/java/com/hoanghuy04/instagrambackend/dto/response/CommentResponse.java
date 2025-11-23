package com.hoanghuy04.instagrambackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for comment response data.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    
    private String id;
    
    private String postId;

    private boolean isAuthorCommentedPost;
    
    private PostLikeUserResponse author;
    
    private String text;
    
    private Long totalLike;
    
    private Long totalReply;

    private boolean totalPin;

    private boolean pinned;

    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    private String parentCommentId;

    private List<String> mentions;

    private boolean isLikedByCurrentUser;
}

