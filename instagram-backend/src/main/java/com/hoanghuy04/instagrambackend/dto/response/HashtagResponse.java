package com.hoanghuy04.instagrambackend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HashtagResponse {
    private String id;
    private String tag;
    private long usageCount;
}
