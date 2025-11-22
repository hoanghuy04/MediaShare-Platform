package com.hoanghuy04.instagrambackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/*
 * @description: CommentCreateRequest
 * @author: Trần Ngọc Huyền
 * @date: 11/21/2025
 * @version: 1.0
 */
@Data
public class CommentCreateRequest {

    @NotBlank
    private String text;

    private String parentCommentId;

    private String mention;
}
