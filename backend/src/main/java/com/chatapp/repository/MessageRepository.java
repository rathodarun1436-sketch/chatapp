package com.chatapp.repository;

import com.chatapp.entity.Message;
import com.chatapp.entity.enums.MessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByChatRoomIdAndDeletedFalseOrderBySentAtAsc(Long roomId, Pageable pageable);

    // Last message per room (for sidebar preview)
    @Query("SELECT m FROM Message m WHERE m.chatRoom.id = :roomId AND m.deleted = false ORDER BY m.sentAt DESC LIMIT 1")
    java.util.Optional<Message> findLatestMessage(Long roomId);

    // Unread count for a user in a room
    @Query("SELECT COUNT(m) FROM Message m WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.status != :status")
    long countUnread(Long roomId, Long userId, MessageStatus status);

    // Mark messages as delivered
    @Modifying
    @Query("UPDATE Message m SET m.status = :status WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.status = com.chatapp.entity.enums.MessageStatus.SENT")
    void markDelivered(Long roomId, Long userId, MessageStatus status);

    // Full-text search in messages
    @Query("SELECT m FROM Message m WHERE m.chatRoom.id IN :roomIds AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) AND m.deleted = false ORDER BY m.sentAt DESC")
    List<Message> searchMessages(List<Long> roomIds, String query);
}
