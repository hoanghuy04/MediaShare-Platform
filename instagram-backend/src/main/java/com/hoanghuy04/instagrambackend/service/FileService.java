package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.entity.MediaFile;
import com.hoanghuy04.instagrambackend.enums.MediaCategory;
import com.hoanghuy04.instagrambackend.enums.MediaUsage;
import com.hoanghuy04.instagrambackend.exception.FileUploadException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.MediaFileRepository;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service class for file operations.
 * Handles file uploads, deletions, and validations.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final MediaFileRepository mediaFileRepository;
    private final SecurityUtil securityUtil;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.max-size}")
    private long maxFileSize;

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp"
    );

    private static final List<String> ALLOWED_VIDEO_EXTENSIONS = Arrays.asList(
            "mp4", "mov", "avi", "wmv", "flv", "mkv"
    );

    private static final List<String> ALLOWED_AUDIO_EXTENSIONS = Arrays.asList(
            "m4a", "aac", "mp3", "wav", "ogg"
    );

    private static final long DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    /**
     * Upload a file and return MediaFile ID.
     *
     * @param file the file to upload
     * @param usage the usage type (POST, REEL, STORY, PROFILE)
     * @return the MediaFile ID
     */
    @Transactional
    public MediaFileResponse uploadFile(MultipartFile file, MediaUsage usage) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Uploading file for user: {} with usage: {}", userId, usage);

        if (file.isEmpty()) {
            throw new FileUploadException("File is empty");
        }

        // Validate file
        validateFileType(file.getOriginalFilename());
        validateFileSize(file.getSize());

        // Determine media category from content type
        String contentType = file.getContentType();
        MediaCategory category = determineMediaCategory(contentType);

        // Save file to disk
        String filePath = saveFile(file);
        String filename = Paths.get(filePath).getFileName().toString();

        // Save file metadata to database
        MediaFile mediaFile = MediaFile.builder()
                .userId(userId)
                .fileName(filename)
                .filePath(filePath)
                .fileSize(file.getSize())
                .category(category)
                .usage(usage)
                .contentType(contentType)
                .build();

        mediaFile = mediaFileRepository.save(mediaFile);

        log.info("File uploaded successfully: {} -> ID: {}", filePath, mediaFile.getId());

        String url = getFileUrl(mediaFile.getFileName());
        return MediaFileResponse.builder()
                .id(mediaFile.getId())
                .url(url)
                .fileName(mediaFile.getFileName())
                .fileSize(mediaFile.getFileSize())
                .category(mediaFile.getCategory())
                .usage(mediaFile.getUsage())
                .contentType(mediaFile.getContentType())
                .uploadedAt(mediaFile.getUploadedAt())
                .build();
    }

    /**
     * Upload multiple files.
     *
     * @param files the list of files to upload
     * @param usage the usage type
     * @return the list of MediaFile IDs
     */
    @Transactional
    public List<String> uploadMultipleFiles(List<MultipartFile> files, MediaUsage usage) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Uploading {} files for user: {}", files.size(), userId);

        if (files == null || files.isEmpty()) {
            throw new FileUploadException("No files provided");
        }

        List<String> fileIds = new ArrayList<>();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String fileId = uploadFile(file, usage).getId();
                fileIds.add(fileId);
            }
        }

        log.info("Successfully uploaded {} files", fileIds.size());
        return fileIds;
    }

    /**
     * Get MediaFile by ID and convert to response with URL.
     *
     * @param fileId the file ID
     * @return MediaFileResponse
     */
    @Transactional(readOnly = true)
    public MediaFileResponse getMediaFileResponse(String fileId) {
        if (fileId == null) {
            return null;
        }

        if (fileId.startsWith("http://") || fileId.startsWith("https://")) {
            // If it's already a URL, return as is
            return MediaFileResponse.builder()
                    .id(null)
                    .url(fileId)
                    .build();
        }

        MediaFile mediaFile = mediaFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("Media file not found with id: " + fileId));

        return convertToMediaFileResponse(mediaFile);
    }

    /**
     * Get multiple MediaFiles by IDs.
     *
     * @param fileIds list of file IDs
     * @return list of MediaFileResponse
     */
    @Transactional(readOnly = true)
    public List<MediaFileResponse> getMediaFileResponses(List<String> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return new ArrayList<>();
        }

        return fileIds.stream()
                .map(this::getMediaFileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Convert MediaFile entity to MediaFileResponse with URL.
     *
     * @param mediaFile the MediaFile entity
     * @return MediaFileResponse
     */
    private MediaFileResponse convertToMediaFileResponse(MediaFile mediaFile) {
        String url = getFileUrl(mediaFile.getFileName());

        return MediaFileResponse.builder()
                .id(mediaFile.getId())
                .url(url)
                .fileName(mediaFile.getFileName())
                .fileSize(mediaFile.getFileSize())
                .category(mediaFile.getCategory())
                .usage(mediaFile.getUsage())
                .contentType(mediaFile.getContentType())
                .uploadedAt(mediaFile.getUploadedAt())
                .build();
    }

    /**
     * Determine media category from content type.
     *
     * @param contentType the content type
     * @return MediaCategory
     */
    private MediaCategory determineMediaCategory(String contentType) {
        if (contentType != null) {
            if (contentType.startsWith("image/")) {
                return MediaCategory.IMAGE;
            } else if (contentType.startsWith("video/")) {
                return MediaCategory.VIDEO;
            } else if (contentType.startsWith("audio/")) {
                return MediaCategory.AUDIO;
            }
        }
        return MediaCategory.IMAGE; // default
    }

    /**
     * Delete a file by ID.
     *
     * @param fileId the file ID to delete
     */
    @Transactional
    public void deleteFile(String fileId) {
        log.info("Deleting file: {}", fileId);

        MediaFile mediaFile = mediaFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("Media file not found with id: " + fileId));

        // Delete file from disk
        deleteFileFromDisk(mediaFile.getFilePath());

        // Delete from database
        mediaFileRepository.delete(mediaFile);

        log.info("File deleted successfully");
    }

    /**
     * Save an uploaded file to the upload directory.
     *
     * @param file the file to save
     * @return the saved file path
     * @throws FileUploadException if file upload fails
     */
    private String saveFile(MultipartFile file) {
        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + extension;

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return filePath.toString();
        } catch (IOException e) {
            throw new FileUploadException("Failed to save file: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a file from the file system.
     *
     * @param filePath the path of the file to delete
     * @throws FileUploadException if file deletion fails
     */
    private void deleteFileFromDisk(String filePath) {
        try {
            Path path = Paths.get(filePath);
            if (Files.exists(path)) {
                Files.delete(path);
            }
        } catch (IOException e) {
            throw new FileUploadException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    /**
     * Get file extension from filename.
     *
     * @param filename the filename
     * @return the file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Validate if the file is an image.
     *
     * @param filename the filename to validate
     * @return true if the file is an image, false otherwise
     */
    private boolean isImageFile(String filename) {
        String extension = getFileExtension(filename);
        return ALLOWED_IMAGE_EXTENSIONS.contains(extension);
    }

    /**
     * Validate if the file is a video.
     *
     * @param filename the filename to validate
     * @return true if the file is a video, false otherwise
     */
    private boolean isVideoFile(String filename) {
        String extension = getFileExtension(filename);
        return ALLOWED_VIDEO_EXTENSIONS.contains(extension);
    }

    private boolean isAudioFile(String filename) {
        String extension = getFileExtension(filename);
        return ALLOWED_AUDIO_EXTENSIONS.contains(extension);
    }

    /**
     * Validate file type (image, video, or audio).
     *
     * @param filename the filename to validate
     * @throws FileUploadException if file type is not allowed
     */
    private void validateFileType(String filename) {
        if (!isImageFile(filename) && !isVideoFile(filename) && !isAudioFile(filename)) {
            throw new FileUploadException("File type not allowed. Only images, videos, and audio files are accepted.");
        }
    }

    /**
     * Validate file size.
     *
     * @param fileSize the file size in bytes
     * @throws FileUploadException if file size exceeds limit
     */
    private void validateFileSize(long fileSize) {
        long limit = maxFileSize > 0 ? maxFileSize : DEFAULT_MAX_FILE_SIZE;
        if (fileSize <= 0 || fileSize > limit) {
            throw new FileUploadException(
                    "File size exceeds the maximum limit of " + (limit / 1024 / 1024) + "MB");
        }
    }

    /**
     * Generate full URL for a file.
     *
     * @param filename the filename
     * @return the full URL
     */
    private String getFileUrl(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }
        return baseUrl + contextPath + "/files/" + filename;
    }

    /**
     * Convert file path to URL.
     *
     * @param filePath the file path
     * @return the URL
     */
    public String convertFilePathToUrl(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }

        // Extract filename from path
        String filename = Paths.get(filePath).getFileName().toString();
        return getFileUrl(filename);
    }
}

