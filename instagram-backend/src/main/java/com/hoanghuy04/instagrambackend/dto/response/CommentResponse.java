package com.hoanghuy04.instagrambackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    
    private UserResponse author;
    
    private String text;
    
    private Integer likesCount;
    
    private Integer repliesCount;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    private String parentCommentId;

    private String mention;

    private boolean isLikedByCurrentUser;
}

