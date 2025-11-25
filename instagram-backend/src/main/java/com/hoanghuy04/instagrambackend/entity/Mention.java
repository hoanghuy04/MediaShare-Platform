package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.MentionTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * A single mention of a user inside a Post caption or Comment content.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mentions")
public class Mention {

    @Id
    private String id;

    @Indexed
    private MentionTargetType targetType;

    @Indexed
    private String targetId;

    @Indexed
    private String mentionedUserId;

    @Indexed
    private String createdByUserId;

    @CreatedDate
    private LocalDateTime createdAt;
}
