package com.chatapp.entity.enums;

public enum MessageStatus {
    SENT,       // saved to DB
    DELIVERED,  // recipient's client connected
    READ        // recipient opened the chat
}
