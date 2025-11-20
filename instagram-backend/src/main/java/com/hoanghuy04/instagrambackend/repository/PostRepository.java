package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Post entity operations.
 * Provides CRUD operations and custom queries for post management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    
    /**
     * Find all posts by a specific author.
     *
     * @param author the user who created the posts
     * @param pageable pagination information
     * @return Page of posts by the author
     */
    Page<Post> findByAuthor(User author, Pageable pageable);
    
    /**
     * Find all posts by author ID.
     *
     * @param authorId the ID of the author
     * @param pageable pagination information
     * @return Page of posts by the author
     */
    Page<Post> findByAuthorId(String authorId, Pageable pageable);
    
    /**
     * Find posts by author IDs (for feed).
     *
     * @param authorIds list of author IDs
     * @param pageable pagination information
     * @return Page of posts from specified authors
     */
    Page<Post> findByAuthorIdIn(List<String> authorIds, Pageable pageable);
    
    /**
     * Find posts containing specific tags.
     *
     * @param tag the hashtag to search for
     * @param pageable pagination information
     * @return Page of posts containing the tag
     */
    Page<Post> findByTagsContaining(String tag, Pageable pageable);
    
    /**
     * Count posts by author.
     *
     * @param author the user who created the posts
     * @return number of posts by the author
     */
    long countByAuthor(User author);

    Page<Post> findByType(PostType postType, Pageable pageable);
}

