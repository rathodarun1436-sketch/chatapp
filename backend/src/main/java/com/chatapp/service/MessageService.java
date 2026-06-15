package com.chatapp.service;

import com.chatapp.dto.request.SendMessageRequest;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.dto.response.UserResponse;
import com.chatapp.entity.ChatRoom;
import com.chatapp.entity.Message;
import com.chatapp.entity.User;
import com.chatapp.entity.enums.MessageStatus;
import com.chatapp.repository.ChatRoomRepository;
import com.chatapp.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageResponse sendMessage(String senderEmail, SendMessageRequest req) {
        User sender = userService.findByEmail(senderEmail);
        ChatRoom room = chatRoomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Message message = Message.builder()
                .chatRoom(room)
                .sender(sender)
                .content(req.getContent())
                .type(req.getType())
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .fileSize(req.getFileSize())
                .status(MessageStatus.SENT)
                .replyToId(req.getReplyToMessageId())
                .build();

        message = messageRepository.save(message);
        MessageResponse response = toMessageResponse(message);

        // Broadcast to all room subscribers via WebSocket
        messagingTemplate.convertAndSend("/topic/room." + room.getId(), response);

        return response;
    }

    public MessageResponse uploadAndSendFile(String senderEmail, Long roomId, MultipartFile file) throws IOException {
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("uploads/files");
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(filename));

        SendMessageRequest req = new SendMessageRequest();
        req.setRoomId(roomId);
        req.setFileUrl("/uploads/files/" + filename);
        req.setFileName(file.getOriginalFilename());
        req.setFileSize(file.getSize());

        String contentType = file.getContentType() != null ? file.getContentType() : "";
        if (contentType.startsWith("image/")) req.setType(com.chatapp.entity.enums.MessageType.IMAGE);
        else if (contentType.startsWith("audio/")) req.setType(com.chatapp.entity.enums.MessageType.VOICE);
        else if (contentType.startsWith("video/")) req.setType(com.chatapp.entity.enums.MessageType.VIDEO);
        else req.setType(com.chatapp.entity.enums.MessageType.FILE);

        return sendMessage(senderEmail, req);
    }

    public List<MessageResponse> getMessages(Long roomId, int page, int size) {
        return messageRepository.findByChatRoomIdAndDeletedFalseOrderBySentAtAsc(
                        roomId, PageRequest.of(page, size))
                .stream().map(this::toMessageResponse).toList();
    }

    public void markRead(Long roomId, String readerEmail) {
        User reader = userService.findByEmail(readerEmail);
        messageRepository.markDelivered(roomId, reader.getId(), MessageStatus.READ);
        // Notify the room that this user has read
        messagingTemplate.convertAndSend("/topic/room." + roomId + ".read",
                new ReadReceiptEvent(roomId, reader.getId()));
    }

    public void sendTypingEvent(Long roomId, String email, boolean typing) {
        UserResponse user = userService.getMe(email);
        messagingTemplate.convertAndSend("/topic/room." + roomId + ".typing",
                new TypingEvent(roomId, user.getId(), user.getName(), typing));
    }

    public List<MessageResponse> searchMessages(String email, String query) {
        User user = userService.findByEmail(email);
        List<Long> roomIds = chatRoomRepository.findRoomsByUserId(user.getId())
                .stream().map(ChatRoom::getId).toList();
        return messageRepository.searchMessages(roomIds, query)
                .stream().map(this::toMessageResponse).toList();
    }

    public void deleteMessage(Long messageId, String email) {
        User user = userService.findByEmail(email);
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getSender().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own messages");
        }
        message.setDeleted(true);
        messageRepository.save(message);
        messagingTemplate.convertAndSend(
                "/topic/room." + message.getChatRoom().getId() + ".delete",
                new DeleteEvent(message.getChatRoom().getId(), messageId)
        );
    }

    private MessageResponse toMessageResponse(Message m) {
        Set<Long> readByIds = m.getReadBy().stream().map(User::getId).collect(Collectors.toSet());
        MessageResponse.MessageResponseBuilder builder = MessageResponse.builder()
                .id(m.getId())
                .roomId(m.getChatRoom().getId())
                .sender(userService.toUserResponse(m.getSender()))
                .content(m.getContent())
                .type(m.getType())
                .status(m.getStatus())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .fileSize(m.getFileSize())
                .readByUserIds(readByIds)
                .sentAt(m.getSentAt());

        if (m.getReplyToId() != null) {
            messageRepository.findById(m.getReplyToId()).ifPresent(replied -> {
                builder.replyToId(replied.getId());
                builder.replyToSenderName(replied.getSender().getName());
                String preview = replied.getContent() != null
                        ? replied.getContent().substring(0, Math.min(80, replied.getContent().length()))
                        : replied.getType().name().toLowerCase();
                builder.replyToContent(preview);
            });
        }

        return builder.build();
    }

    // Inline event records for WebSocket broadcasts
    public record ReadReceiptEvent(Long roomId, Long userId) {}
    public record TypingEvent(Long roomId, Long userId, String userName, boolean typing) {}
    public record DeleteEvent(Long roomId, Long messageId) {}
}
