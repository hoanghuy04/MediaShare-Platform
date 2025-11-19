package com.hoanghuy04.instagrambackend.util;

import com.hoanghuy04.instagrambackend.exception.FileUploadException;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Utility class for file operations.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class FileUtil {
    
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp"
    );
    
    private static final List<String> ALLOWED_VIDEO_EXTENSIONS = Arrays.asList(
            "mp4", "mov", "avi", "wmv", "flv", "mkv"
    );
    
    private static final long DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    private FileUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    /**
     * Save an uploaded file to the specified directory.
     *
     * @param file the file to save
     * @param uploadDir the directory to save the file in
     * @return the saved file path
     * @throws FileUploadException if file upload fails
     */
    public static String saveFile(MultipartFile file, String uploadDir) {
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
    public static void deleteFile(String filePath) {
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
    public static String getFileExtension(String filename) {
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
    public static boolean isImageFile(String filename) {
        String extension = getFileExtension(filename);
        return ALLOWED_IMAGE_EXTENSIONS.contains(extension);
    }
    
    /**
     * Validate if the file is a video.
     *
     * @param filename the filename to validate
     * @return true if the file is a video, false otherwise
     */
    public static boolean isVideoFile(String filename) {
        String extension = getFileExtension(filename);
        return ALLOWED_VIDEO_EXTENSIONS.contains(extension);
    }
    
    /**
     * Validate file size.
     *
     * @param fileSize the file size in bytes
     * @return true if file size is within limit, false otherwise
     */
    public static boolean isValidFileSize(long fileSize, long maxFileSize) {
        long limit = maxFileSize > 0 ? maxFileSize : DEFAULT_MAX_FILE_SIZE;
        return fileSize > 0 && fileSize <= limit;
    }
    
    /**
     * Validate file type (image or video).
     *
     * @param filename the filename to validate
     * @throws FileUploadException if file type is not allowed
     */
    public static void validateFileType(String filename) {
        if (!isImageFile(filename) && !isVideoFile(filename)) {
            throw new FileUploadException("File type not allowed. Only images and videos are accepted.");
        }
    }
    
    /**
     * Validate file size.
     *
     * @param fileSize the file size in bytes
     * @throws FileUploadException if file size exceeds limit
     */
    public static void validateFileSize(long fileSize, long maxFileSize) {
        long limit = maxFileSize > 0 ? maxFileSize : DEFAULT_MAX_FILE_SIZE;
        if (!isValidFileSize(fileSize, limit)) {
            throw new FileUploadException(
                    "File size exceeds the maximum limit of " + (limit / 1024 / 1024) + "MB");
        }
    }
    
    /**
     * Get a file from the file system.
     *
     * @param filePath the path of the file
     * @return the File object
     */
    public static File getFile(String filePath) {
        Path path = Paths.get(filePath);
        if (!Files.exists(path)) {
            throw new FileUploadException("File not found: " + filePath);
        }
        return path.toFile();
    }
}

