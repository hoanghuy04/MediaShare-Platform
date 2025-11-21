package com.hoanghuy04.instagrambackend.service.conversationtheme;

import com.hoanghuy04.instagrambackend.dto.request.ApplyThemeRequest;
import com.hoanghuy04.instagrambackend.dto.response.ChatThemeDTO;
import com.hoanghuy04.instagrambackend.dto.response.ConversationThemeDTO;

import java.util.List;

public interface ConversationThemeService {
    List<ChatThemeDTO> listThemes();

    ConversationThemeDTO applyTheme(String conversationId, ApplyThemeRequest req);

    void clearTheme(String conversationId);
}
