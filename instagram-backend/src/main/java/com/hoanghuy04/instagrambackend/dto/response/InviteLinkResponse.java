package com.hoanghuy04.instagrambackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteLinkResponse {
    private String conversationId;
    private String token;
    private String url;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Integer maxUses;
    private Integer usedCount;
    private Boolean active;
}

