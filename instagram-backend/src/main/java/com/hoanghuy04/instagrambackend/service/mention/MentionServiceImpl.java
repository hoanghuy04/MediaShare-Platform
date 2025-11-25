package com.hoanghuy04.instagrambackend.service.mention;

import com.hoanghuy04.instagrambackend.dto.response.MentionUserResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MentionServiceImpl implements MentionService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final SecurityUtil securityUtil;

    @Override
    public PageResponse<MentionUserResponse> search(String query, Pageable pageable) {
        String currentUserId = securityUtil.getCurrentUserId();

        if (query == null || query.trim().isEmpty()) {
            return emptyPageResponse(pageable);
        }

        String qNorm = normalize(query.trim());

        int rawFetchSize = Math.min(pageable.getPageSize() * 3, 60);
        Pageable fetchPage = PageRequest.of(0, rawFetchSize);

        String prefixRegex = "^" + qNorm;
        List<User> prefixMatches =
                userRepository.findByUsernameSearchRegex(prefixRegex, fetchPage);

        List<User> containsMatches = Collections.emptyList();
        if (prefixMatches.size() < rawFetchSize) {
            containsMatches = userRepository.findByUsernameSearchRegex(qNorm, fetchPage);
        }

        LinkedHashMap<String, User> merged = new LinkedHashMap<>();

        prefixMatches.forEach(u -> {
            if (!u.getId().equals(currentUserId)) {
                merged.put(u.getId(), u);
            }
        });

        containsMatches.forEach(u -> {
            if (!u.getId().equals(currentUserId)) {
                merged.putIfAbsent(u.getId(), u);
            }
        });

        List<User> candidates = new ArrayList<>(merged.values());

        Set<String> followingIds = followRepository.findByFollowerId(currentUserId)
                .stream()
                .map(Follow::getFollowingId)
                .collect(Collectors.toSet());

        Set<String> followerIds = followRepository.findByFollowingId(currentUserId)
                .stream()
                .map(Follow::getFollowerId)
                .collect(Collectors.toSet());

        List<User> sorted = candidates.stream()
                .sorted((a, b) -> Double.compare(
                        score(b, qNorm, followingIds, followerIds),
                        score(a, qNorm, followingIds, followerIds)
                ))
                .collect(Collectors.toList());

        int pageNumber = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageSize, sorted.size());

        List<User> pageSlice =
                start >= sorted.size() ? Collections.emptyList() : sorted.subList(start, end);

        long totalElements = sorted.size();

        List<MentionUserResponse> content = pageSlice.stream()
                .map(u -> {
                    boolean followedByCurrent = followingIds.contains(u.getId());
                    boolean followingCurrent = followerIds.contains(u.getId());
                    boolean mutual = followedByCurrent && followingCurrent;

                    return MentionUserResponse.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .fullName(u.getProfile().getFirstName() + " " + u.getProfile().getLastName())
                            .avatarUrl(u.getProfile().getAvatar())
                            .followedByCurrentUser(followedByCurrent)
                            .followingCurrentUser(followingCurrent)
                            .mutual(mutual)
                            .build();
                })
                .collect(Collectors.toList());

        int totalPages = pageSize == 0
                ? 1
                : (int) Math.ceil((double) totalElements / (double) pageSize);
        boolean last = (pageNumber + 1) >= totalPages;

        return PageResponse.<MentionUserResponse>builder()
                .content(content)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(last)
                .build();
    }

    private double score(
            User user,
            String qNorm,
            Set<String> followingIds,
            Set<String> followerIds
    ) {
        boolean followedByCurrent = followingIds.contains(user.getId());
        boolean followingCurrent = followerIds.contains(user.getId());
        boolean mutual = followedByCurrent && followingCurrent;

        int matchScore = user.getUsernameSearch().startsWith(qNorm) ? 2 : 1;
        int relationshipScore = mutual
                ? 3
                : (followedByCurrent || followingCurrent ? 2 : 0);

        return matchScore * 3 + relationshipScore * 5;
    }

    private String normalize(String text) {
        return Normalizer.normalize(text.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    private PageResponse<MentionUserResponse> emptyPageResponse(Pageable pageable) {
        return PageResponse.<MentionUserResponse>builder()
                .content(Collections.emptyList())
                .pageNumber(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalElements(0L)
                .totalPages(0)
                .last(true)
                .build();
    }
}
