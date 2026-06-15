package com.chatapp.controller;

import com.chatapp.dto.request.SendMessageRequest;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.service.MessageService;
import com.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final MessageService messageService;
    private final UserService userService;

    // Client sends to /app/chat.send
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest req, Principal principal) {
        messageService.sendMessage(principal.getName(), req);
    }

    // Client sends to /app/chat.typing
    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingPayload payload, Principal principal) {
        messageService.sendTypingEvent(payload.roomId(), principal.getName(), payload.typing());
    }

    // Client sends to /app/chat.read
    @MessageMapping("/chat.read")
    public void read(@Payload ReadPayload payload, Principal principal) {
        messageService.markRead(payload.roomId(), principal.getName());
    }

    @EventListener
    public void onConnect(SessionConnectedEvent event) {
        if (event.getUser() != null) {
            userService.findByEmail(event.getUser().getName());
            // Set user online in a real app, extract userId from principal
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        if (event.getUser() != null) {
            try {
                var user = userService.findByEmail(event.getUser().getName());
                userService.setOnline(user.getId(), false);
            } catch (Exception ignored) {}
        }
    }

    public record TypingPayload(Long roomId, boolean typing) {}
    public record ReadPayload(Long roomId) {}
}
