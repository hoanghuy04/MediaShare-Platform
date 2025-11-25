package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.enums.PostType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for post response data.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {

    private String id;

    private UserSummaryResponse author;

    private String caption;

    private PostType type;

    private List<MediaFileResponse> media;

    private Long totalLike;

    private Long totalComment;

    private List<HashtagResponse> tags;

    private String location;

    private boolean isLikedByCurrentUser;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

