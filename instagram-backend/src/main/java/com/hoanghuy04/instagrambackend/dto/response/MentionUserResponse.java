package com.hoanghuy04.instagrambackend.dto.response;

import lombok.*;

/*
 * @description: MentionUserResponse
 * @author: Trần Ngọc Huyền
 * @date: 11/25/2025
 * @version: 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentionUserResponse {

    private String id;
    private String username;
    private String fullName;
    private String avatarUrl;

    private boolean followedByCurrentUser;
    private boolean followingCurrentUser;
    private boolean mutual;
}
