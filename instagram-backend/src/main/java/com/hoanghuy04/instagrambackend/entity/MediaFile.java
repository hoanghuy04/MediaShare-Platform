package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.FileType;
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
    
    /**
     * Unique identifier for the media file
     */
    @Id
    private String id;
    
    /**
     * ID of the user who uploaded this file
     */
    @Indexed
    private String userId;
    
    /**
     * Original filename
     */
    private String fileName;
    
    /**
     * File path where the file is stored
     */
    private String filePath;
    
    /**
     * File size in bytes
     */
    private Long fileSize;
    
    /**
     * Type of file (PROFILE_IMAGE, POST_MEDIA, COVER_IMAGE)
     */
    private FileType fileType;
    
    /**
     * Timestamp when the file was uploaded
     */
    @CreatedDate
    @Indexed
    private LocalDateTime uploadedAt;
}

