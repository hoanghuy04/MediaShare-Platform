package com.hoanghuy04.instagrambackend.dto.response;

import lombok.*;

/*
 * @description: CommentLikeToggleResponse
 * @author: Trần Ngọc Huyền
 * @date: 11/22/2025
 * @version: 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentLikeToggleResponse {

    private String postId;

    private String commentId;

    private Long totalLikes;

    private boolean liked;
}
