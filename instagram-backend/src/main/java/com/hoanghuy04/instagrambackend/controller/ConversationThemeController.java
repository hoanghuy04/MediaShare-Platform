package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.ApplyThemeRequest;
import com.hoanghuy04.instagrambackend.dto.response.ChatThemeDTO;
import com.hoanghuy04.instagrambackend.dto.response.ConversationThemeDTO;
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
    public ResponseEntity<List<ChatThemeDTO>> listThemes() {
        return ResponseEntity.ok(service.listThemes());
    }

    @PostMapping("/conversations/{id}/theme")
    public ResponseEntity<ConversationThemeDTO> applyTheme(
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
