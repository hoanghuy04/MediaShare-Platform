package com.hoanghuy04.instagrambackend.dto.response;

import lombok.*;

/*
 * @description: PostLikeResponse
 * @author: Trần Ngọc Huyền
 * @date: 11/21/2025
 * @version: 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostLikeToggleResponse {
    private String postId;
    private boolean liked;
}
