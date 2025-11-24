package com.hoanghuy04.instagrambackend.dto.response;

import lombok.*;

/*
 * @description: FollowToggleResponse
 * @author: Trần Ngọc Huyền
 * @date: 11/24/2025
 * @version: 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowToggleResponse {

    private String followerId;

    private String followingId;

    private boolean followingByCurrentUser;
}
