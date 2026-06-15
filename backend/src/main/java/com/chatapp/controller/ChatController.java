package com.chatapp.controller;

import com.chatapp.dto.request.CreateGroupRequest;
import com.chatapp.dto.request.SendMessageRequest;
import com.chatapp.dto.response.ChatRoomResponse;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.service.ChatService;
import com.chatapp.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getRooms(@AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(chatService.getUserRooms(u.getUsername()));
    }

    @PostMapping("/rooms/private/{targetUserId}")
    public ResponseEntity<ChatRoomResponse> openPrivate(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(chatService.getOrCreatePrivateRoom(u.getUsername(), targetUserId));
    }

    @PostMapping("/rooms/group")
    public ResponseEntity<ChatRoomResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(chatService.createGroup(u.getUsername(), req));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(messageService.getMessages(roomId, page, size));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(messageService.sendMessage(u.getUsername(), req));
    }

    @PostMapping("/rooms/{roomId}/upload")
    public ResponseEntity<MessageResponse> uploadFile(
            @PathVariable Long roomId,
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal UserDetails u) throws IOException {
        return ResponseEntity.ok(messageService.uploadAndSendFile(u.getUsername(), roomId, file));
    }

    @PostMapping("/rooms/{roomId}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserDetails u) {
        messageService.markRead(roomId, u.getUsername());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails u) {
        messageService.deleteMessage(messageId, u.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<MessageResponse>> searchMessages(
            @RequestParam String query,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(messageService.searchMessages(u.getUsername(), query));
    }
}
