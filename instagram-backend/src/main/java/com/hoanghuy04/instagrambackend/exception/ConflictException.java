package com.hoanghuy04.instagrambackend.exception;

/**
 * Exception thrown when there is a data conflict (e.g., duplicate username/email).
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class ConflictException extends RuntimeException {
    
    /**
     * Constructs a new ConflictException with the specified detail message.
     *
     * @param message the detail message
     */
    public ConflictException(String message) {
        super(message);
    }
    
    /**
     * Constructs a new ConflictException with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause
     */
    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}

