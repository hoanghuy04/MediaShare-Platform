package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.enums.FileType;
import com.hoanghuy04.instagrambackend.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for file upload endpoints.
 * Handles file uploads and deletions.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
@Tag(name = "File Upload", description = "File upload management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class FileUploadController {
    
    private final FileStorageService fileStorageService;
    
    /**
     * Upload profile image.
     *
     * @param file the file to upload
     * @param userId the user ID uploading the file
     * @return ResponseEntity with file path
     */
    @PostMapping("/profile-image")
    @Operation(summary = "Upload profile image")
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam String userId) {
        log.info("Upload profile image request received from user: {}", userId);
        
        String filePath = fileStorageService.uploadFile(file, userId, FileType.PROFILE_IMAGE);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", filePath));
    }
    
    /**
     * Upload post media.
     *
     * @param file the file to upload
     * @param userId the user ID uploading the file
     * @return ResponseEntity with file path
     */
    @PostMapping("/post-media")
    @Operation(summary = "Upload post media")
    public ResponseEntity<ApiResponse<String>> uploadPostMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam String userId) {
        log.info("Upload post media request received from user: {}", userId);
        
        String filePath = fileStorageService.uploadFile(file, userId, FileType.POST_MEDIA);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", filePath));
    }
    
    /**
     * Delete a file.
     *
     * @param fileId the file path to delete
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/files/{fileId}")
    @Operation(summary = "Delete a file")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable String fileId) {
        log.info("Delete file request received for file: {}", fileId);
        
        fileStorageService.deleteFile(fileId);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully", null));
    }
}

