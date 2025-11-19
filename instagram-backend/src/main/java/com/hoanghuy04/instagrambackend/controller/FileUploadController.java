package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.enums.FileType;
import com.hoanghuy04.instagrambackend.service.FileStorageService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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
     * @return ResponseEntity with file path
     */
    @PostMapping("/profile-image")
    @Operation(summary = "Upload profile image")
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(
            @RequestParam("file") MultipartFile file) {
        String filePath = fileStorageService.uploadFile(file, FileType.PROFILE_IMAGE);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", filePath));
    }
    
    /**
     * Upload post media.
     *
     * @param file the file to upload
     * @return ResponseEntity with file path
     */
    @PostMapping("/post-media")
    @Operation(summary = "Upload post media")
    public ResponseEntity<ApiResponse<String>> uploadPostMedia(
            @RequestParam("file") MultipartFile file) {
        String filePath = fileStorageService.uploadFile(file, FileType.POST_MEDIA);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", filePath));
    }
    
    /**
     * Upload multiple post media files (batch upload).
     *
     * @param files the list of files to upload
     * @return ResponseEntity with list of file paths
     */
    @PostMapping("/post-media/batch")
    @Operation(summary = "Upload multiple post media files")
    public ResponseEntity<ApiResponse<List<String>>> uploadMultiplePostMedia(
            @RequestParam("files") List<MultipartFile> files) {

        List<String> filePaths = fileStorageService.uploadMultipleFiles(files, FileType.POST_MEDIA);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Files uploaded successfully", filePaths));
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

