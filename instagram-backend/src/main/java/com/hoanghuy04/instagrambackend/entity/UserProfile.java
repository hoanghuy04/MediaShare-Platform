package com.hoanghuy04.instagrambackend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embedded document representing user profile information.
 * Contains extended user details beyond basic account information.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {
    
    /**
     * User's first name
     */
    private String firstName;
    
    /**
     * User's last name
     */
    private String lastName;
    
    /**
     * User's biography or description
     */
    private String bio;
    
    /**
     * URL to user's profile avatar image
     */
    private String avatar;
    
    /**
     * URL to user's profile cover image
     */
    private String coverImage;
    
    /**
     * User's website URL
     */
    private String website;
    
    /**
     * User's location
     */
    private String location;
}

