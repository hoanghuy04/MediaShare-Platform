package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Comment entity operations.
 * Provides CRUD operations and custom queries for comment management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    Page<Comment> findByPost(Post post, Pageable pageable);
    Page<Comment> findByPostId(String postId, Pageable pageable);
    Page<Comment> findByAuthor(User author, Pageable pageable);
    long countByPost(Post post);
    void deleteByPost(Post post);
    long countByPost_Id(String postId);
    Page<Comment> findByPostIdAndParentCommentIdIsNull(String postId, Pageable pageable);
    List<Comment> findByParentCommentId(String parentCommentId);
    long countByParentCommentId(String parentCommentId);


}

