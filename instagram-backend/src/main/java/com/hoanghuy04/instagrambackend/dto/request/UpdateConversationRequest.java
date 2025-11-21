package com.hoanghuy04.instagrambackend.dto.request;

import com.hoanghuy04.instagrambackend.enums.AvatarType;
import lombok.*;

@Data
public class UpdateConversationRequest {
    private String name;
    private String avatar;
}