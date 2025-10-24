package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Embedded document representing media content in posts.
 * Contains information about uploaded images or videos.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Media {

    /**
     * URL to the media file
     */
    private String url;
    
    /**
     * Type of media (IMAGE or VIDEO)
     */
    private MediaType type;
    
    /**
     * Timestamp when the media was uploaded
     */
    private LocalDateTime uploadedAt;
}

