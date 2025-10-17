package com.hoanghuy04.instagrambackend.exception;

/**
 * Exception thrown when file upload operations fail.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class FileUploadException extends RuntimeException {
    
    /**
     * Constructs a new FileUploadException with the specified detail message.
     *
     * @param message the detail message
     */
    public FileUploadException(String message) {
        super(message);
    }
    
    /**
     * Constructs a new FileUploadException with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause
     */
    public FileUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}

