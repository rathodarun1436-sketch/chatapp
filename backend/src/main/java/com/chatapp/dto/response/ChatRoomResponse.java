package com.chatapp.dto.response;

import com.chatapp.entity.enums.RoomType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data @Builder
public class ChatRoomResponse {
    private Long id;
    private RoomType type;
    // GROUP fields
    private String name;
    private String groupIcon;
    private String description;
    // PRIVATE: the other user
    private UserResponse otherUser;
    private List<UserResponse> members;
    private MessageResponse lastMessage;
    private long unreadCount;
}
