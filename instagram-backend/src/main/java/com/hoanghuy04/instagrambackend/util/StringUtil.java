package com.hoanghuy04.instagrambackend.util;

import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class for string manipulation operations.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class StringUtil {
    
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#(\\w+)");
    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");
    
    private StringUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    /**
     * Check if a string is null or empty.
     *
     * @param str the string to check
     * @return true if null or empty, false otherwise
     */
    public static boolean isEmpty(String str) {
        return StringUtils.isEmpty(str);
    }
    
    /**
     * Check if a string is not null and not empty.
     *
     * @param str the string to check
     * @return true if not null and not empty, false otherwise
     */
    public static boolean isNotEmpty(String str) {
        return StringUtils.isNotEmpty(str);
    }
    
    /**
     * Check if a string is blank (null, empty, or whitespace).
     *
     * @param str the string to check
     * @return true if blank, false otherwise
     */
    public static boolean isBlank(String str) {
        return StringUtils.isBlank(str);
    }
    
    /**
     * Check if a string is not blank.
     *
     * @param str the string to check
     * @return true if not blank, false otherwise
     */
    public static boolean isNotBlank(String str) {
        return StringUtils.isNotBlank(str);
    }
    
    /**
     * Truncate a string to a specified length.
     *
     * @param str the string to truncate
     * @param maxLength the maximum length
     * @return truncated string
     */
    public static String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength) + "...";
    }
    
    /**
     * Extract hashtags from a text.
     *
     * @param text the text to extract hashtags from
     * @return list of hashtags without the # symbol
     */
    public static List<String> extractHashtags(String text) {
        List<String> hashtags = new ArrayList<>();
        if (text == null) {
            return hashtags;
        }
        
        Matcher matcher = HASHTAG_PATTERN.matcher(text);
        while (matcher.find()) {
            hashtags.add(matcher.group(1));
        }
        return hashtags;
    }
    
    /**
     * Extract mentions from a text.
     *
     * @param text the text to extract mentions from
     * @return list of mentions without the @ symbol
     */
    public static List<String> extractMentions(String text) {
        List<String> mentions = new ArrayList<>();
        if (text == null) {
            return mentions;
        }
        
        Matcher matcher = MENTION_PATTERN.matcher(text);
        while (matcher.find()) {
            mentions.add(matcher.group(1));
        }
        return mentions;
    }
    
    /**
     * Sanitize a string by removing special characters.
     *
     * @param str the string to sanitize
     * @return sanitized string
     */
    public static String sanitize(String str) {
        if (str == null) {
            return null;
        }
        return str.replaceAll("[^a-zA-Z0-9._-]", "");
    }
    
    /**
     * Capitalize the first letter of a string.
     *
     * @param str the string to capitalize
     * @return capitalized string
     */
    public static String capitalize(String str) {
        return StringUtils.capitalize(str);
    }
    
    /**
     * Convert a string to lowercase.
     *
     * @param str the string to convert
     * @return lowercase string
     */
    public static String toLowerCase(String str) {
        return str != null ? str.toLowerCase() : null;
    }
    
    /**
     * Convert a string to uppercase.
     *
     * @param str the string to convert
     * @return uppercase string
     */
    public static String toUpperCase(String str) {
        return str != null ? str.toUpperCase() : null;
    }
    
    /**
     * Generate a slug from a string (URL-friendly).
     *
     * @param str the string to convert
     * @return slug string
     */
    public static String toSlug(String str) {
        if (str == null) {
            return null;
        }
        return str.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}

