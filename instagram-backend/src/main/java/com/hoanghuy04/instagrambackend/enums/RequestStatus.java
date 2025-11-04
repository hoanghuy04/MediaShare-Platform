package com.hoanghuy04.instagrambackend.enums;

/**
 * Enum representing the status of a message request.
 * Used when users who are not connected try to message each other.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
public enum RequestStatus {
    PENDING,    // Chờ phản hồi - awaiting response
    ACCEPTED,   // Đã chấp nhận - request accepted
    REJECTED,   // Đã từ chối - request rejected
    IGNORED     // Bỏ qua - request ignored
}


