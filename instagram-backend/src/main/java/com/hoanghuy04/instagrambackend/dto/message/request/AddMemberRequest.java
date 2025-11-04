package com.hoanghuy04.instagrambackend.dto.message.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for adding members to a group conversation.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequest {
    
    /**
     * List of user IDs to add to the group
     */
    @NotEmpty(message = "At least one user ID is required")
    private List<String> userIds;
}


