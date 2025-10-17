package com.hoanghuy04.instagrambackend.enums;

/**
 * Enumeration for user roles in the system.
 * Defines different levels of access and permissions.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public enum UserRole {
    /**
     * Regular user with standard permissions
     */
    USER,
    
    /**
     * Administrator with full system access
     */
    ADMIN,
    
    /**
     * Moderator with content management permissions
     */
    MODERATOR
}

