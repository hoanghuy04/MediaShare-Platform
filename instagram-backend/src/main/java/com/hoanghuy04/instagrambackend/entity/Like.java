package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.LikeTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;

/**
 * Entity representing a like on a post.
 * Tracks which users liked which posts.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "likes")
@CompoundIndex(name = "user_target_idx", def = "{'user': 1, 'targetType': 1, 'targetId': 1}", unique = true)
public class Like {

    @Id
    private String id;

    @DocumentReference
    private User user;

    @Indexed
    private LikeTargetType targetType;

    @Indexed
    private String targetId;

    @CreatedDate
    private LocalDateTime createdAt;

}

