package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.enums.PostType;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PostService {
    @Transactional
    PostResponse createPost(CreatePostRequest request);

    @Transactional(readOnly = true)
    PostResponse getPost(String postId);

    @Transactional(readOnly = true)
    PageResponse<PostResponse> getAllPosts(Pageable pageable);

    @Transactional(readOnly = true)
    PageResponse<PostResponse> getUserPosts(String userId, Pageable pageable);

    @Transactional(readOnly = true)
    PageResponse<PostResponse> getFeedPosts(Pageable pageable);

    @Transactional(readOnly = true)
    PageResponse<PostResponse> getPostsByType(PostType type, Pageable pageable);

    @Transactional(readOnly = true)
    PageResponse<PostResponse> getExplore(Pageable pageable);

    @Transactional
    PostResponse updatePost(String postId, CreatePostRequest request);

    @Transactional
    void deletePost(String postId);

    @Transactional(readOnly = true)
    Post getPostEntityById(String postId);

}
