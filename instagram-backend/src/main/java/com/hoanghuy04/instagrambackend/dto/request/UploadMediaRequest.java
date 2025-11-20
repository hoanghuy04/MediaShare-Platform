package com.hoanghuy04.instagrambackend.dto.request;

import com.hoanghuy04.instagrambackend.enums.MediaUsage;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for uploading media file.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadMediaRequest {
    
    @NotNull(message = "Media usage is required")
    private MediaUsage usage;
}
