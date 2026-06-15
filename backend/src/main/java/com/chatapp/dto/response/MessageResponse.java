package com.chatapp.dto.response;

import com.chatapp.entity.enums.MessageStatus;
import com.chatapp.entity.enums.MessageType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data @Builder
public class MessageResponse {
    private Long id;
    private Long roomId;
    private UserResponse sender;
    private String content;
    private MessageType type;
    private MessageStatus status;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private Set<Long> readByUserIds;
    private LocalDateTime sentAt;
    private Long replyToId;
    private String replyToContent;
    private String replyToSenderName;
}
