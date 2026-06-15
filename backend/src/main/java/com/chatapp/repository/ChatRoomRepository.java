package com.chatapp.repository;

import com.chatapp.entity.ChatRoom;
import com.chatapp.entity.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // Find all rooms for a user, ordered by latest message
    @Query("""
        SELECT DISTINCT cr FROM ChatRoom cr
        JOIN cr.members m
        WHERE m.id = :userId
        ORDER BY cr.createdAt DESC
    """)
    List<ChatRoom> findRoomsByUserId(Long userId);

    // Find existing private room between two users
    @Query("""
        SELECT cr FROM ChatRoom cr
        JOIN cr.members m1 ON m1.id = :userId1
        JOIN cr.members m2 ON m2.id = :userId2
        WHERE cr.type = :type
    """)
    Optional<ChatRoom> findPrivateRoomBetween(Long userId1, Long userId2, RoomType type);

    // Check if a room has a specific member
    @Query("SELECT COUNT(u) > 0 FROM ChatRoom cr JOIN cr.members u WHERE cr.id = :roomId AND u.id = :userId")
    boolean isMember(Long roomId, Long userId);
}
