package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.ChatThemeResponse;
import com.hoanghuy04.instagrambackend.dto.response.ConversationThemeResponse;
import com.hoanghuy04.instagrambackend.entity.conversation.ConversationTheme;
import com.hoanghuy04.instagrambackend.entity.ChatTheme;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public abstract class ThemeMapper {

    // ChatTheme -> ChatThemeDTO (map id -> key)
    @Mappings({
            @Mapping(source = "id", target = "key")
    })
    public abstract ChatThemeResponse toDTO(ChatTheme entity);

    // ConversationTheme -> ConversationThemeDTO (trùng tên, map tự động)
    public abstract ConversationThemeResponse toDTO(ConversationTheme entity);

    // ChatTheme -> ConversationTheme (để áp theme vào conversation)
    // themeKey lấy từ id; wallpaperUrl cho phép override qua @Context
    @Mappings({
            @Mapping(target = "themeKey", source = "id"),
            @Mapping(target = "bubbleIn", source = "bubbleIn"),
            @Mapping(target = "bubbleOut", source = "bubbleOut"),
            @Mapping(target = "bubbleText", source = "bubbleText"),
            @Mapping(target = "headerBg", source = "headerBg"),
            @Mapping(target = "headerText", source = "headerText"),
            @Mapping(target = "tint", source = "tint"),
            @Mapping(target = "fabBg", source = "fabBg"),
            @Mapping(target = "wallpaperUrl",
                    expression = "java(override != null && !override.isBlank() ? override : src.getWallpaperUrl())")
    })
    public abstract ConversationTheme toConversationTheme(ChatTheme src, @Context String override);

}
