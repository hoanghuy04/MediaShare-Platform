package com.hoanghuy04.instagrambackend.service.conversationtheme;

import com.hoanghuy04.instagrambackend.dto.request.ApplyThemeRequest;
import com.hoanghuy04.instagrambackend.dto.response.ChatThemeResponse;
import com.hoanghuy04.instagrambackend.dto.response.ConversationThemeResponse;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.conversation.ConversationTheme;
import com.hoanghuy04.instagrambackend.entity.ChatTheme;
import com.hoanghuy04.instagrambackend.mapper.ThemeMapper;
import com.hoanghuy04.instagrambackend.repository.ChatThemeRepository;
import com.hoanghuy04.instagrambackend.repository.ConversationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationThemeServiceImpl implements ConversationThemeService {

    ConversationRepository conversationRepository;
    ChatThemeRepository chatThemeRepository;
    ThemeMapper themeMapper;

    @Override
    public List<ChatThemeResponse> listThemes() {
        return chatThemeRepository.findAll()
                .stream().map(themeMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public ConversationThemeResponse applyTheme(String conversationId, ApplyThemeRequest req) {
        if (!StringUtils.hasText(conversationId) || !StringUtils.hasText(req.getThemeKey())) {
            throw new IllegalArgumentException("conversationId/themeKey is required");
        }

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        ChatTheme theme = chatThemeRepository.findById(req.getThemeKey())
                .orElseThrow(() -> new IllegalArgumentException("Theme not found"));

        // Dùng MapStruct để tạo ConversationTheme từ ChatTheme
        ConversationTheme applied = themeMapper.toConversationTheme(theme, req.getOverrideWallpaperUrl());

        conv.setTheme(applied);
        conversationRepository.save(conv);

        return themeMapper.toDTO(applied);
    }

    @Override
    public void clearTheme(String conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        conv.setTheme(null);
        conversationRepository.save(conv);
    }
}
