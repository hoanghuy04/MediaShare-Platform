package com.hoanghuy04.instagrambackend.entity.theme;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_themes")
public class ChatTheme {
    @Id
    private String id;

    private String name;
    private Boolean dark;

    // Tokens
    private String bubbleIn;
    private String bubbleOut;
    private String bubbleText;
    private String headerBg;
    private String headerText;
    private String tint;
    private String fabBg;

    private String wallpaperUrl;

    @CreatedDate
    private LocalDateTime createdAt;
}
