package com.hoanghuy04.instagrambackend.exception;

/**
 * Exception thrown when a bad request is made.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class BadRequestException extends RuntimeException {
    
    /**
     * Constructs a new BadRequestException with the specified detail message.
     *
     * @param message the detail message
     */
    public BadRequestException(String message) {
        super(message);
    }
    
    /**
     * Constructs a new BadRequestException with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause
     */
    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}

