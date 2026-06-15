package com.chatapp.entity;

import com.chatapp.entity.enums.RoomType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "chat_rooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType type;

    // For GROUP rooms only
    private String name;
    private String groupIcon;
    private String description;

    @Column(name = "created_by")
    private Long createdBy;

    @ManyToMany(mappedBy = "chatRooms", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<User> members = new HashSet<>();

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> messages;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Helper: get the other user in a PRIVATE chat
    public User getOtherMember(Long currentUserId) {
        return members.stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .findFirst()
                .orElse(null);
    }
}
