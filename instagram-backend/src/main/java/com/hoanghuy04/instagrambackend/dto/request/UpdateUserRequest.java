package com.hoanghuy04.instagrambackend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for updating user profile information.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;
    
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;
    
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;
    
    @Size(max = 200, message = "Website URL must not exceed 200 characters")
    private String website;
    
    @Size(max = 100, message = "Location must not exceed 100 characters")
    private String location;
    
    private boolean isPrivate;
}

