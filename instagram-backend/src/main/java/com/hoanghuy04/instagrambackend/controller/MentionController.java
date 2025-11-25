package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.MentionUserResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.service.mention.MentionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/mentions")
@Tag(name = "File Management", description = "File upload, download and management APIs")
public class MentionController {

    private final MentionService mentionService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<MentionUserResponse>>> search(
            @RequestParam("q") String q,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(mentionService.search(q, pageable)));
    }

}
