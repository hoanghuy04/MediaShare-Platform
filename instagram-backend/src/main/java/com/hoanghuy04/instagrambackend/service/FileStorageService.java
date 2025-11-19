package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.entity.MediaFile;
import com.hoanghuy04.instagrambackend.enums.FileType;
import com.hoanghuy04.instagrambackend.exception.FileUploadException;
import com.hoanghuy04.instagrambackend.repository.MediaFileRepository;
import com.hoanghuy04.instagrambackend.util.FileUtil;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

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

    private final SecurityUtil securityUtil;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.max-size}")
    private long maxFileSize;

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Value("${server.port:8080}")
    private String serverPort;

    /**
     * Upload a file.
     *
     * @param file the file to upload
     * @param fileType the type of file being uploaded
     * @return the file path
     */
    @Transactional
    public String uploadFile(MultipartFile file, FileType fileType) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Uploading file for user: {}", userId);

        if (file.isEmpty()) {
            throw new FileUploadException("File is empty");
        }

        // Validate file
        FileUtil.validateFileType(file.getOriginalFilename());
        FileUtil.validateFileSize(file.getSize(), maxFileSize);

        // Save file to disk
        String filePath = FileUtil.saveFile(file, uploadDir);

        // Get filename from path for URL generation
        String filename = Paths.get(filePath).getFileName().toString();

        // Save file metadata to database
        MediaFile mediaFile = MediaFile.builder()
                .userId(userId)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(fileType)
                .build();

        mediaFileRepository.save(mediaFile);

        // Generate full URL for the file
        String fileUrl = getFileUrl(filename);

        log.info("File uploaded successfully: {} -> {}", filePath, fileUrl);

        return fileUrl;
    }

    /**
     * Upload multiple files.
     *
     * @param files the list of files to upload
     * @param fileType the type of files being uploaded
     * @return the list of file paths
     */
    @Transactional
    public List<String> uploadMultipleFiles(List<MultipartFile> files, FileType fileType) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Uploading {} files for user: {}", files.size(), userId);

        if (files == null || files.isEmpty()) {
            throw new FileUploadException("No files provided");
        }

        List<String> filePaths = new ArrayList<>();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String filePath = uploadFile(file, fileType);
                filePaths.add(filePath);
            }
        }

        log.info("Successfully uploaded {} files", filePaths.size());
        return filePaths;
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
        return FileUtil.isValidFileSize(fileSize, maxFileSize);
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

    /**
     * Generate full URL for a file.
     *
     * @param filename the filename
     * @return the full URL
     */
    public String getFileUrl(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }

        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/files/")
                    .path(filename)
                    .toUriString();
        } catch (Exception e) {
            log.warn("Failed to generate URL for file: {}", filename, e);
            // Fallback to manual URL construction
            return "http://localhost:" + serverPort + contextPath + "/files/" + filename;
        }
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

