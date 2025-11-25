package com.hoanghuy04.instagrambackend.service.hashtag;

import com.hoanghuy04.instagrambackend.dto.request.HashtagRequest;
import com.hoanghuy04.instagrambackend.dto.response.HashtagResponse;
import com.hoanghuy04.instagrambackend.entity.Hashtag;
import com.hoanghuy04.instagrambackend.repository.HashtagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HashtagServiceImpl implements HashtagService {

    private final HashtagRepository hashtagRepository;

    @Override
    public HashtagResponse createHashtag(HashtagRequest request) {
        Hashtag exist = hashtagRepository.findByTag(request.getTag()).orElse(null);
        if (exist != null) {
            return toResponse(exist);
        }

        Hashtag tag = Hashtag.builder()
                .tag(request.getTag())
                .usageCount(0)
                .build();

        hashtagRepository.save(tag);
        return toResponse(tag);
    }

    @Override
    public HashtagResponse getByTag(String tag) {
        return hashtagRepository.findByTag(tag)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    public List<HashtagResponse> search(String keyword) {
        return hashtagRepository.findAll().stream()
                .filter(t -> t.getTag().contains(keyword))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public HashtagResponse increaseUsage(String tag) {
        Hashtag hashtag = hashtagRepository.findByTag(tag)
                .orElseGet(() -> hashtagRepository.save(
                        Hashtag.builder().tag(tag).usageCount(0).build()
                ));

        hashtag.setUsageCount(hashtag.getUsageCount() + 1);
        hashtagRepository.save(hashtag);

        return toResponse(hashtag);
    }

    @Override
    public List<HashtagResponse> getTrending(int limit) {
        return hashtagRepository.findAll().stream()
                .sorted((a, b) -> Long.compare(b.getUsageCount(), a.getUsageCount()))
                .limit(limit)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private HashtagResponse toResponse(Hashtag entity) {
        return HashtagResponse.builder()
                .id(entity.getId())
                .tag(entity.getTag())
                .usageCount(entity.getUsageCount())
                .build();
    }
}
