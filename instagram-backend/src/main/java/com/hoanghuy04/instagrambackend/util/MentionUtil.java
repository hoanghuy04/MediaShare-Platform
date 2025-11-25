package com.hoanghuy04.instagrambackend.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/*
 * @description: MentionUtil
 * @author: Trần Ngọc Huyền
 * @date: 11/25/2025
 * @version: 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MentionUtil {
    private static final Pattern MENTION_PATTERN =
            Pattern.compile("(?<=^|[^a-zA-Z0-9_])@([a-zA-Z0-9_.]+)");

    public List<String> extractMentionUsernames(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyList();
        }

        Matcher matcher = MENTION_PATTERN.matcher(text);
        List<String> usernames = new ArrayList<>();

        while (matcher.find()) {
            String username = matcher.group(1);
            usernames.add(username.toLowerCase());
        }

        return usernames.stream().distinct().toList();
    }

}
