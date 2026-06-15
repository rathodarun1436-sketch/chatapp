package com.chatapp.dto.request;

import com.chatapp.entity.enums.MessageType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull
    private Long roomId;

    private String content;

    private MessageType type = MessageType.TEXT;

    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private Long replyToMessageId;
}
