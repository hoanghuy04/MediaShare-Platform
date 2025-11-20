package com.hoanghuy04.instagrambackend.entity.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Theme áp cho từng conversation (sub-document). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationTheme {
    /** Khóa theme tiêu chuẩn (nếu lấy từ danh mục), có thể null với theme custom. */
    private String themeKey;

    private String bubbleIn;     // HEX
    private String bubbleOut;    // HEX (accent)
    private String bubbleText;   // HEX
    private String headerBg;     // HEX
    private String headerText;   // HEX
    private String tint;         // HEX (dùng overlay)
    private String fabBg;        // HEX

    /** Hình nền riêng cho cuộc trò chuyện (ưu tiên hiển thị nếu có). */
    private String wallpaperUrl;
}
