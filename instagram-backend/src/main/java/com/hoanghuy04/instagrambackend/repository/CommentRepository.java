package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Comment entity operations.
 * Provides CRUD operations and custom queries for comment management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {
    
    /**
     * Find all comments for a specific post.
     *
     * @param post the post to find comments for
     * @param pageable pagination information
     * @return Page of comments on the post
     */
    Page<Comment> findByPost(Post post, Pageable pageable);
    
    /**
     * Find all comments for a specific post by post ID.
     *
     * @param postId the ID of the post
     * @param pageable pagination information
     * @return Page of comments on the post
     */
    Page<Comment> findByPostId(String postId, Pageable pageable);
    
    /**
     * Find all comments by a specific author.
     *
     * @param author the user who created the comments
     * @param pageable pagination information
     * @return Page of comments by the author
     */
    Page<Comment> findByAuthor(User author, Pageable pageable);
    
    /**
     * Count comments for a specific post.
     *
     * @param post the post to count comments for
     * @return number of comments on the post
     */
    long countByPost(Post post);
    
    /**
     * Delete all comments for a specific post.
     *
     * @param post the post whose comments should be deleted
     */
    void deleteByPost(Post post);
}

