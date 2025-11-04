package com.hoanghuy04.instagrambackend.controller.admin;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.migration.ChatMigrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for database migration operations.
 * Only accessible by admin users.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@RestController
@RequestMapping("/admin/migration")
@RequiredArgsConstructor
@Tag(name = "Migration", description = "Database migration APIs (Admin only)")
@SecurityRequirement(name = "Bearer Authentication")
public class MigrationController {
    
    private final ChatMigrationService migrationService;
    
    /**
     * Migrate existing messages to conversation-based structure.
     * This will create Conversation entities from existing Message pairs.
     *
     * @return ResponseEntity with success message
     */
    @PostMapping("/chat/to-conversations")
    @Operation(summary = "Migrate messages to conversations", description = "Convert existing direct messages into conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> migrateToConversations() {
        log.info("Chat migration to conversations requested by admin");
        
        try {
            migrationService.migrateToConversations();
            return ResponseEntity.ok(ApiResponse.success(
                "Migration completed successfully", 
                "Chat data has been migrated to conversation-based structure"
            ));
        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Migration failed: " + e.getMessage()));
        }
    }
    
    /**
     * Clean up deprecated fields after migration verification.
     * WARNING: This is a destructive operation!
     *
     * @return ResponseEntity with success message
     */
    @PostMapping("/chat/cleanup")
    @Operation(summary = "Cleanup deprecated fields", description = "Remove old receiver and isRead fields after migration verification")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> cleanupDeprecatedFields() {
        log.info("Cleanup deprecated fields requested by admin");
        
        try {
            migrationService.cleanupDeprecatedFields();
            return ResponseEntity.ok(ApiResponse.success(
                "Cleanup completed successfully",
                "Deprecated fields have been removed"
            ));
        } catch (Exception e) {
            log.error("Cleanup failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Cleanup failed: " + e.getMessage()));
        }
    }
}



