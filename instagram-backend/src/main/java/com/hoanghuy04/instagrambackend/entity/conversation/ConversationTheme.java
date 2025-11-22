package com.hoanghuy04.instagrambackend.entity.message;

import lombok.*;
import lombok.experimental.FieldDefaults;

/** Theme áp cho từng conversation (sub-document). */
@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationTheme {
     String themeKey;
     String bubbleIn;
     String bubbleOut;
     String bubbleText;
     String headerBg;
     String headerText;
     String tint;
     String fabBg;
     String wallpaperUrl;
}
