package com.hoanghuy04.instagrambackend.service.hashtag;

import com.hoanghuy04.instagrambackend.dto.request.HashtagRequest;
import com.hoanghuy04.instagrambackend.dto.response.HashtagResponse;

import java.util.List;

public interface HashtagService {

    HashtagResponse createHashtag(HashtagRequest request);

    HashtagResponse getByTag(String tag);

    List<HashtagResponse> search(String keyword);

    HashtagResponse increaseUsage(String tag);

    List<HashtagResponse> getTrending(int limit);
}
