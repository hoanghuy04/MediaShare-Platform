package com.hoanghuy04.instagrambackend.dto.response;

import lombok.*;

/*
 * @description: PostLikeUserResponse
 * @author: Trần Ngọc Huyền
 * @date: 11/21/2025
 * @version: 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostLikeUserResponse {
    private String id;
    private String username;
    private String avatarUrl;
}
