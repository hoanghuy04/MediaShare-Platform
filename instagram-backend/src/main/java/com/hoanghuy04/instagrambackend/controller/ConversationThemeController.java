package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.ApplyThemeRequest;
import com.hoanghuy04.instagrambackend.dto.response.ChatThemeResponse;
import com.hoanghuy04.instagrambackend.dto.response.ConversationThemeResponse;
import com.hoanghuy04.instagrambackend.service.conversationtheme.ConversationThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConversationThemeController {

    private final ConversationThemeService service;

    @GetMapping("/themes")
    public ResponseEntity<List<ChatThemeResponse>> listThemes() {
        return ResponseEntity.ok(service.listThemes());
    }

    @PostMapping("/conversations/{id}/theme")
    public ResponseEntity<ConversationThemeResponse> applyTheme(
            @PathVariable("id") String conversationId,
            @RequestBody ApplyThemeRequest request) {
        return ResponseEntity.ok(service.applyTheme(conversationId, request));
    }

    @DeleteMapping("/conversations/{id}/theme")
    public ResponseEntity<Void> clearTheme(@PathVariable("id") String conversationId) {
        service.clearTheme(conversationId);
        return ResponseEntity.noContent().build();
    }
}
