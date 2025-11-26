package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByReceiverIdOrderByCreatedAtDesc(String receiverId, Pageable pageable);

    List<Notification> findByReceiverIdOrderByCreatedAtDesc(String receiverId);

    long countByReceiverIdAndReadFalse(String receiverId);

    List<Notification> findByReceiverIdAndReadFalse(String receiverId);
}
