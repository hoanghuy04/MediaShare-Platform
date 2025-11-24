package com.hoanghuy04.instagrambackend.dto.response;

import lombok.*;

/*
 * @description: FollowerUserResponse -
 * @author: Instagram Backend Team
 * @date: 11/24/2025
 * @version: 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowerUserResponse {
    private String id;
    private String username;
    private String avatarUrl;
    private Boolean followingByCurrentUser ;
}
