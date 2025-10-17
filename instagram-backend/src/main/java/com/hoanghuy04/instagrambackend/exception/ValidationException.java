package com.hoanghuy04.instagrambackend.exception;

/**
 * Exception thrown when data validation fails.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class ValidationException extends RuntimeException {
    
    /**
     * Constructs a new ValidationException with the specified detail message.
     *
     * @param message the detail message
     */
    public ValidationException(String message) {
        super(message);
    }
    
    /**
     * Constructs a new ValidationException with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause
     */
    public ValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}

