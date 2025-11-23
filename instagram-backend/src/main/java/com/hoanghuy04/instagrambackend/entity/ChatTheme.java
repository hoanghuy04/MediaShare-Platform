package com.hoanghuy04.instagrambackend.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "chat_themes")
public class ChatTheme {
    @Id
    String id;

    String name;
    Boolean dark;

    String bubbleIn;
    String bubbleOut;
    String bubbleText;
    String headerBg;
    String headerText;
    String tint;
    String fabBg;

    String wallpaperUrl;

    @CreatedDate
    LocalDateTime createdAt;
}
