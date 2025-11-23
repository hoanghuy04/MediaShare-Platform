package com.hoanghuy04.instagrambackend.dto.request;
import lombok.Data;

@Data
public class ApplyThemeRequest {
    private String themeKey;             // bắt buộc
    private String overrideWallpaperUrl; // optional
}