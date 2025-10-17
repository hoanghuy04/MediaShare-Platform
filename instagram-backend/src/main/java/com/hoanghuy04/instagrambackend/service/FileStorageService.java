package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.entity.MediaFile;
import com.hoanghuy04.instagrambackend.enums.FileType;
import com.hoanghuy04.instagrambackend.exception.FileUploadException;
import com.hoanghuy04.instagrambackend.repository.MediaFileRepository;
import com.hoanghuy04.instagrambackend.util.FileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

/**
 * Service class for file storage operations.
 * Handles file uploads, deletions, and validations.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {
    
    private final MediaFileRepository mediaFileRepository;
    
    @Value("${file.upload-dir}")
    private String uploadDir;
    
    @Value("${file.max-size}")
    private long maxFileSize;
    
    /**
     * Upload a file.
     *
     * @param file the file to upload
     * @param userId the user ID uploading the file
     * @param fileType the type of file being uploaded
     * @return the file path
     */
    @Transactional
    public String uploadFile(MultipartFile file, String userId, FileType fileType) {
        log.info("Uploading file for user: {}", userId);
        
        if (file.isEmpty()) {
            throw new FileUploadException("File is empty");
        }
        
        // Validate file
        FileUtil.validateFileType(file.getOriginalFilename());
        FileUtil.validateFileSize(file.getSize());
        
        // Save file to disk
        String filePath = FileUtil.saveFile(file, uploadDir);
        
        // Save file metadata to database
        MediaFile mediaFile = MediaFile.builder()
                .userId(userId)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(fileType)
                .build();
        
        mediaFileRepository.save(mediaFile);
        
        log.info("File uploaded successfully: {}", filePath);
        
        return filePath;
    }
    
    /**
     * Delete a file.
     *
     * @param filePath the file path to delete
     */
    @Transactional
    public void deleteFile(String filePath) {
        log.info("Deleting file: {}", filePath);
        
        MediaFile mediaFile = mediaFileRepository.findByFilePath(filePath);
        if (mediaFile != null) {
            mediaFileRepository.delete(mediaFile);
        }
        
        FileUtil.deleteFile(filePath);
        
        log.info("File deleted successfully");
    }
    
    /**
     * Validate file size.
     *
     * @param fileSize the file size in bytes
     * @return true if valid, false otherwise
     */
    public boolean validateFileSize(long fileSize) {
        return FileUtil.isValidFileSize(fileSize);
    }
    
    /**
     * Validate file type.
     *
     * @param contentType the content type
     * @return true if valid, false otherwise
     */
    public boolean validateFileType(String contentType) {
        return contentType != null && 
               (contentType.startsWith("image/") || contentType.startsWith("video/"));
    }
    
    /**
     * Get an uploaded file.
     *
     * @param filePath the file path
     * @return the File object
     */
    public File getUploadedFile(String filePath) {
        log.debug("Getting uploaded file: {}", filePath);
        return FileUtil.getFile(filePath);
    }
}

