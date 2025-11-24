package com.hoanghuy04.instagrambackend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "follows")
public class Follow {

    @Id
    private String id;

    @DocumentReference
    @Indexed
    private User follower;

    @DocumentReference
    @Indexed
    private User following;

    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;
}
