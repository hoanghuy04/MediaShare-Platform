package com.hoanghuy04.instagrambackend.service.mention;

import com.hoanghuy04.instagrambackend.dto.response.MentionUserResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

/*
 * @description: MentionService
 * @author: Trần Ngọc Huyền
 * @date: 11/25/2025
 * @version: 1.0
 */
public interface MentionService {
    PageResponse<MentionUserResponse> search(String query, Pageable pageable);
}
