package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.MediaCategory;
import com.hoanghuy04.instagrambackend.enums.MediaUsage;
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
 * Entity representing an uploaded media file.
 * Tracks file metadata and storage information.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "media_files")
public class MediaFile {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String fileName;
    private String filePath;
    private Long fileSize;

    // IMAGE / VIDEO
    private MediaCategory category;

    // PROFILE / POST / STORY / REEL / COVER
    private MediaUsage usage;

    // VD: "image/jpeg", "image/png", "video/mp4"
    private String contentType;

    @CreatedDate
    @Indexed
    private LocalDateTime uploadedAt;
}


