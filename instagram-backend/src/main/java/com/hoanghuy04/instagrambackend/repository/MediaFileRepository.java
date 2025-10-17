package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.MediaFile;
import com.hoanghuy04.instagrambackend.enums.FileType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for MediaFile entity operations.
 * Provides CRUD operations and custom queries for media file management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface MediaFileRepository extends MongoRepository<MediaFile, String> {
    
    /**
     * Find all media files uploaded by a user.
     *
     * @param userId the ID of the user
     * @param pageable pagination information
     * @return Page of media files uploaded by the user
     */
    Page<MediaFile> findByUserId(String userId, Pageable pageable);
    
    /**
     * Find media files by user ID and file type.
     *
     * @param userId the ID of the user
     * @param fileType the type of files to find
     * @return List of media files matching the criteria
     */
    List<MediaFile> findByUserIdAndFileType(String userId, FileType fileType);
    
    /**
     * Find a media file by file path.
     *
     * @param filePath the path to the file
     * @return MediaFile if found
     */
    MediaFile findByFilePath(String filePath);
    
    /**
     * Delete media files by user ID.
     *
     * @param userId the ID of the user
     */
    void deleteByUserId(String userId);
}

