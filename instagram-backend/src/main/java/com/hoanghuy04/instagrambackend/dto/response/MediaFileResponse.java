package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.enums.MediaCategory;
import com.hoanghuy04.instagrambackend.enums.MediaUsage;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for media file response with URL.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MediaFileResponse {
    
    private String id;
    
    /**
     * Full URL to access the media file
     */
    private String url;
    
    private String fileName;
    
    private Long fileSize;
    
    private MediaCategory category;
    
    private MediaUsage usage;
    
    private String contentType;
    
    private LocalDateTime uploadedAt;
}
