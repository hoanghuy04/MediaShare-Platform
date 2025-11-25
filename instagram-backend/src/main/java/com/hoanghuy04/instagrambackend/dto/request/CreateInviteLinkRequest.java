package com.hoanghuy04.instagrambackend.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateInviteLinkRequest {
    private Integer maxUses;
    private LocalDateTime expiresAt;
}

