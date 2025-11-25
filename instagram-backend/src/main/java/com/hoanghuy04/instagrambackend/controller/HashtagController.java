package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.HashtagRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.HashtagResponse;
import com.hoanghuy04.instagrambackend.service.hashtag.HashtagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hashtags")
@RequiredArgsConstructor
@Tag(name = "Hashtag Management", description = "APIs for hashtag operations")
public class HashtagController {

    private final HashtagService hashtagService;

    @Operation(summary = "Create new hashtag")
    @PostMapping
    public ResponseEntity<ApiResponse<HashtagResponse>> createHashtag(@RequestBody HashtagRequest request) {
        HashtagResponse response = hashtagService.createHashtag(request);
        return ResponseEntity.ok(ApiResponse.<HashtagResponse>builder()
                .message("Hashtag created successfully")
                .data(response)
                .build());
    }

    @Operation(summary = "Get hashtag by tag name")
    @GetMapping("/{tag}")
    public ResponseEntity<ApiResponse<HashtagResponse>> getByTag(@PathVariable String tag) {
        HashtagResponse response = hashtagService.getByTag(tag);
        return ResponseEntity.ok(ApiResponse.<HashtagResponse>builder()
                .message("Hashtag retrieved successfully")
                .data(response)
                .build());
    }

    @Operation(summary = "Search hashtags by keyword (supports partial matching with %)")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<HashtagResponse>>> search(
            @RequestParam(required = false, defaultValue = "") String keyword) {
        List<HashtagResponse> results = hashtagService.search(keyword);
        return ResponseEntity.ok(ApiResponse.<List<HashtagResponse>>builder()
                .message("Search completed successfully")
                .data(results)
                .build());
    }

    @Operation(summary = "Get trending hashtags")
    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<HashtagResponse>>> getTrending(
            @RequestParam(defaultValue = "20") int limit) {
        List<HashtagResponse> results = hashtagService.getTrending(limit);
        return ResponseEntity.ok(ApiResponse.<List<HashtagResponse>>builder()
                .message("Trending hashtags retrieved successfully")
                .data(results)
                .build());
    }

    @Operation(summary = "Increase usage count of hashtag")
    @PostMapping("/{tag}/increase")
    public ResponseEntity<ApiResponse<HashtagResponse>> increaseUsage(@PathVariable String tag) {
        HashtagResponse response = hashtagService.increaseUsage(tag);
        return ResponseEntity.ok(ApiResponse.<HashtagResponse>builder()
                .message("Hashtag usage increased")
                .data(response)
                .build());
    }
}
