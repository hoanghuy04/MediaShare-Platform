package com.hoanghuy04.instagrambackend.dto.response;

import lombok.Data;

@Data
public class ConversationThemeResponse {
    private String themeKey;
    private String bubbleIn;
    private String bubbleOut;
    private String bubbleText;
    private String headerBg;
    private String headerText;
    private String tint;
    private String fabBg;
    private String wallpaperUrl;
}