package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.enums.MediaUsage;
import com.hoanghuy04.instagrambackend.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * REST controller for file operations.
 * Handles file uploads, serving, and deletions.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/files")
@Tag(name = "File Management", description = "File upload, download and management APIs")
public class FileController {

    private final FileService fileService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Upload profile image.
     *
     * @param file the file to upload
     * @return ResponseEntity with MediaFile ID
     */
    @PostMapping("/upload/profile-image")
    @Operation(summary = "Upload profile image")
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<MediaFileResponse>> uploadProfileImage(
            @RequestParam("file") MultipartFile file) {
        MediaFileResponse mediaFileResponse = fileService.uploadFile(file, MediaUsage.PROFILE);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", mediaFileResponse));
    }

    /**
     * Upload post media.
     *
     * @param file the file to upload
     * @param usage the media usage (POST, REEL, STORY)
     * @return ResponseEntity with MediaFile ID
     */
    @PostMapping("/upload/post-media")
    @Operation(summary = "Upload post media")
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<MediaFileResponse>> uploadPostMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "usage", defaultValue = "POST") MediaUsage usage) {
        MediaFileResponse mediaFileResponse = fileService.uploadFile(file, usage);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", mediaFileResponse));
    }

    /**
     * Upload multiple post media files (batch upload).
     *
     * @param files the list of files to upload
     * @param usage the media usage
     * @return ResponseEntity with list of MediaFile IDs
     */
    @PostMapping("/upload/post-media/batch")
    @Operation(summary = "Upload multiple post media files")
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<List<String>>> uploadMultiplePostMedia(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "usage", defaultValue = "POST") MediaUsage usage) {

        List<String> fileIds = fileService.uploadMultipleFiles(files, usage);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Files uploaded successfully", fileIds));
    }

    /**
     * Delete a file.
     *
     * @param fileId the file ID to delete
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/upload/{fileId}")
    @Operation(summary = "Delete a file")
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable String fileId) {
        log.info("Delete file request received for file: {}", fileId);

        fileService.deleteFile(fileId);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully", null));
    }

    /**
     * Serve a file from the uploads directory.
     *
     * @param filename the filename to serve
     * @return ResponseEntity with the file resource
     */
    @GetMapping("/{filename:.+}")
    @Operation(summary = "Download/serve a file")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = determineContentType(filename);

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                log.warn("File not found: {}", filename);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error serving file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Determine content type based on file extension.
     *
     * @param filename the filename
     * @return the content type
     */
    private String determineContentType(String filename) {
        String extension = "";
        if (filename.contains(".")) {
            extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }

        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "bmp" -> "image/bmp";
            case "webp" -> "image/webp";
            case "svg" -> "image/svg+xml";
            case "mp4" -> "video/mp4";
            case "avi" -> "video/x-msvideo";
            case "mov" -> "video/quicktime";
            case "wmv" -> "video/x-ms-wmv";
            case "flv" -> "video/x-flv";
            case "webm" -> "video/webm";
            case "mkv" -> "video/x-matroska";
            case "mp3" -> "audio/mpeg";
            case "m4a" -> "audio/mp4";
            case "wav" -> "audio/wav";
            case "ogg" -> "audio/ogg";
            case "aac" -> "audio/aac";
            case "flac" -> "audio/flac";
            case "pdf" -> "application/pdf";
            case "txt" -> "text/plain";
            case "json" -> "application/json";
            case "xml" -> "application/xml";
            default -> "application/octet-stream";
        };
    }
}
