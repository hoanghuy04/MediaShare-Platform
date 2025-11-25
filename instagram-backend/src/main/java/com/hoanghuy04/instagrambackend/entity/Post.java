package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.PostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Reference;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a post in the Instagram application.
 * Contains post content, media, and engagement metrics.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "posts")
public class Post {

    @Id
    private String id;

    @DocumentReference
    @Indexed
    private User author;

    private String caption;

    private PostType type; // FEED | REEL | STORY

    private String location;

    @Builder.Default
    private List<String> mediaFileIds = new ArrayList<>();

    @DocumentReference
    private List<Hashtag> tags = new ArrayList<>();

    @Builder.Default
    private List<String> mentions = new ArrayList<>();

    @Builder.Default
    private long totalLikes = 0;

    @Builder.Default
    private long totalComments = 0;

    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

