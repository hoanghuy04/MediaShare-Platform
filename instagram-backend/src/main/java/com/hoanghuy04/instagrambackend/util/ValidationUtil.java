package com.hoanghuy04.instagrambackend.util;

import com.hoanghuy04.instagrambackend.exception.ValidationException;
import org.apache.commons.lang3.StringUtils;

import java.util.regex.Pattern;

/**
 * Utility class for input validation operations.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class ValidationUtil {
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    
    private static final Pattern USERNAME_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9._]{3,30}$"
    );
    
    private static final Pattern URL_PATTERN = Pattern.compile(
            "^(https?://)?(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$"
    );
    
    private ValidationUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    /**
     * Validate if a string is not null or empty.
     *
     * @param value the string to validate
     * @param fieldName the field name for error message
     * @throws ValidationException if validation fails
     */
    public static void validateNotEmpty(String value, String fieldName) {
        if (StringUtils.isBlank(value)) {
            throw new ValidationException(fieldName + " cannot be empty");
        }
    }
    
    /**
     * Validate email format.
     *
     * @param email the email to validate
     * @throws ValidationException if validation fails
     */
    public static void validateEmail(String email) {
        if (StringUtils.isBlank(email) || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException("Invalid email format");
        }
    }
    
    /**
     * Validate username format.
     *
     * @param username the username to validate
     * @throws ValidationException if validation fails
     */
    public static void validateUsername(String username) {
        if (StringUtils.isBlank(username) || !USERNAME_PATTERN.matcher(username).matches()) {
            throw new ValidationException("Username must be 3-30 characters and contain only letters, numbers, dots, and underscores");
        }
    }
    
    /**
     * Validate password strength.
     *
     * @param password the password to validate
     * @throws ValidationException if validation fails
     */
    public static void validatePassword(String password) {
        if (StringUtils.isBlank(password) || password.length() < 6) {
            throw new ValidationException("Password must be at least 6 characters long");
        }
    }
    
    /**
     * Validate URL format.
     *
     * @param url the URL to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidUrl(String url) {
        return StringUtils.isNotBlank(url) && URL_PATTERN.matcher(url).matches();
    }
    
    /**
     * Validate string length.
     *
     * @param value the string to validate
     * @param fieldName the field name for error message
     * @param maxLength the maximum allowed length
     * @throws ValidationException if validation fails
     */
    public static void validateLength(String value, String fieldName, int maxLength) {
        if (value != null && value.length() > maxLength) {
            throw new ValidationException(fieldName + " must not exceed " + maxLength + " characters");
        }
    }
    
    /**
     * Validate that a value is not null.
     *
     * @param value the value to validate
     * @param fieldName the field name for error message
     * @throws ValidationException if validation fails
     */
    public static void validateNotNull(Object value, String fieldName) {
        if (value == null) {
            throw new ValidationException(fieldName + " cannot be null");
        }
    }
    
    /**
     * Validate that a number is positive.
     *
     * @param value the number to validate
     * @param fieldName the field name for error message
     * @throws ValidationException if validation fails
     */
    public static void validatePositive(Number value, String fieldName) {
        if (value == null || value.doubleValue() <= 0) {
            throw new ValidationException(fieldName + " must be positive");
        }
    }
}

