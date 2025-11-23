package com.hoanghuy04.instagrambackend.service.conversationtheme;

import com.hoanghuy04.instagrambackend.dto.request.ApplyThemeRequest;
import com.hoanghuy04.instagrambackend.dto.response.ChatThemeResponse;
import com.hoanghuy04.instagrambackend.dto.response.ConversationThemeResponse;

import java.util.List;

public interface ConversationThemeService {
    List<ChatThemeResponse> listThemes();

    ConversationThemeResponse applyTheme(String conversationId, ApplyThemeRequest req);

    void clearTheme(String conversationId);
}
