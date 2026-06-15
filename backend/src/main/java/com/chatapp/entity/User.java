package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String mobile;

    @Column(name = "profile_pic")
    private String profilePic;

    @Column(nullable = false)
    @Builder.Default
    private boolean online = false;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(name = "about")
    @Builder.Default
    private String about = "Hey there! I am using ChatApp.";

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "chat_room_members",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "room_id")
    )
    @Builder.Default
    private Set<ChatRoom> chatRooms = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
