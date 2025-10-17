package com.hoanghuy04.instagrambackend.dto.request;

import com.hoanghuy04.instagrambackend.entity.Media;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO for creating a new post.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    
    @Size(max = 2200, message = "Caption must not exceed 2200 characters")
    private String caption;
    
    @NotEmpty(message = "At least one media item is required")
    @Builder.Default
    private List<Media> media = new ArrayList<>();
    
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    
    @Size(max = 100, message = "Location must not exceed 100 characters")
    private String location;
}

