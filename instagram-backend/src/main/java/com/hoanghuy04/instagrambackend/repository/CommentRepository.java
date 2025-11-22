package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Comment;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {

    Page<Comment> findByPostAndParentCommentIsNull(Post post, Pageable pageable);

    Page<Comment> findByPostAndParentComment(Post post, Comment parentComment, Pageable pageable);
}

