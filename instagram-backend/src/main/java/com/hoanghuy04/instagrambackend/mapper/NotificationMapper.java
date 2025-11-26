package com.hoanghuy04.instagrambackend.mapper;

/*
 * @description: NotificationMapper
 * @author: Trần Ngọc Huyền
 * @date: 11/26/2025
 * @version: 1.0
 */
import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.dto.response.NotificationResponse;
import com.hoanghuy04.instagrambackend.entity.Notification;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.NotificationType;
import com.hoanghuy04.instagrambackend.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        injectionStrategy = InjectionStrategy.FIELD,
        uses = {UserMapper.class}
)
@Slf4j
public abstract class NotificationMapper {

    @Autowired
    protected UserMapper userMapper;

    @Autowired
    protected FileService fileService;

    /**
     * Main mapping: Notification -> NotificationResponse
     */
    @Mappings({
            @Mapping(target = "id", source = "notification.id"),
            @Mapping(target = "senderId", source = "notification.senderId"),
            @Mapping(target = "postId", source = "notification.postId"),
            @Mapping(target = "author", source = "author"),
            @Mapping(target = "postThumbnail", ignore = true),
            @Mapping(target = "content", ignore = true),
            @Mapping(target = "isLikeComment", ignore = true),
            @Mapping(target = "isFollowingBack", ignore = true),
            @Mapping(target = "createdAt",
                    expression = "java(notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : null)")
    })
    public abstract NotificationResponse toNotificationResponse(
            Notification notification,
            User author,
            @Context boolean isFollowingBack,
            @Context Post post
    );

    @AfterMapping
    protected void afterMapping(
            Notification notification,
            User author,
            @Context boolean isFollowingBack,
            @Context Post post,
            @MappingTarget NotificationResponse.NotificationResponseBuilder response
    ) {
        // resolve isFollowingBack
        response.isFollowingBack(isFollowingBack);

        // resolve post thumbnail if exists
        if (post != null) {
            MediaFileResponse media = fileService.getMediaFileResponses(post.getMediaFileIds()).get(0);
            response.postThumbnail(media.getUrl());
        } else {
            response.postThumbnail(null);
        }

        // determine isLikeComment
        boolean isLikeComment = notification.getType() == NotificationType.LIKE_COMMENT;
        response.isLikeComment(isLikeComment);

        response.content(buildContent(notification, author));
    }


    private String buildContent(Notification n, User author) {
        String username = author.getUsername();

        return switch (n.getType()) {
            case FOLLOW -> username + " đã bắt đầu theo dõi bạn.";
            case LIKE_POST -> username + " đã thích bài viết của bạn.";
            case LIKE_COMMENT -> username + " đã thích bình luận của bạn.";
            case COMMENT_POST -> {
                String msg = n.getMessage();
                if (msg != null && !msg.isBlank()) {
                    yield username + " đã bình luận: \"" + msg + "\"";
                } else {
                    yield username + " đã bình luận bài viết của bạn.";
                }
            }
            default -> username + " " + (n.getMessage() != null ? n.getMessage() : "");
        };
    }

}