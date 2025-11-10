package com.hoanghuy04.instagrambackend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating group conversation information.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupRequest {
    
    /**
     * New group name (optional)
     */
    private String name;
    
    /**
     * New group avatar URL (optional)
     */
    private String avatar;
}


