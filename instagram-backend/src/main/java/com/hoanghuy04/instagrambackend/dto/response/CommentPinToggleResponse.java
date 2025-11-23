package com.hoanghuy04.instagrambackend.dto.response;

import lombok.*;

/*
 * @description: CommentPinToggleResponse
 * @author: Trần Ngọc Huyền
 * @date: 11/23/2025
 * @version: 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentPinToggleResponse {

    private String postId;

    private String commentId;

    private boolean pinned;

    private long totalPin;

    private String userId;
}
