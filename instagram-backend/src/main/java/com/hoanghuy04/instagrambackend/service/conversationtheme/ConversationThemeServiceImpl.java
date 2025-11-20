package com.hoanghuy04.instagrambackend.service.conversationtheme;

import com.hoanghuy04.instagrambackend.dto.request.ApplyThemeRequest;
import com.hoanghuy04.instagrambackend.dto.response.ChatThemeDTO;
import com.hoanghuy04.instagrambackend.dto.response.ConversationThemeDTO;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.ConversationTheme;
import com.hoanghuy04.instagrambackend.entity.theme.ChatTheme;
import com.hoanghuy04.instagrambackend.mapper.ThemeMapper;
import com.hoanghuy04.instagrambackend.repository.ChatThemeRepository;
import com.hoanghuy04.instagrambackend.repository.message.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationThemeServiceImpl implements ConversationThemeService {

    private final ConversationRepository conversationRepository;
    private final ChatThemeRepository chatThemeRepository;
    private final ThemeMapper themeMapper;

    @Override
    public List<ChatThemeDTO> listThemes() {
        return chatThemeRepository.findAll()
                .stream().map(themeMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public ConversationThemeDTO applyTheme(String conversationId, ApplyThemeRequest req) {
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
