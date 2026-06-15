package com.chatapp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String mobile;
    private String profilePic;
    private boolean online;
    private LocalDateTime lastSeen;
    private String about;
}
