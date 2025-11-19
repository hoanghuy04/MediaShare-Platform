package com.hoanghuy04.instagrambackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for creating a group conversation.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {
    
    /**
     * List of participant user IDs (excluding the creator)
     */
    @NotEmpty(message = "Group must have at least one participant")
    private List<String> participantIds;
    
    /**
     * Name of the group
     */
    @NotBlank(message = "Group name is required")
    private String groupName;
    
    /**
     * Optional avatar URL for the group
     */
    private String avatar;
}


