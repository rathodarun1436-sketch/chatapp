package com.chatapp.service;

import com.chatapp.dto.request.CreateGroupRequest;
import com.chatapp.dto.response.ChatRoomResponse;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.entity.ChatRoom;
import com.chatapp.entity.User;
import com.chatapp.entity.enums.MessageStatus;
import com.chatapp.entity.enums.RoomType;
import com.chatapp.repository.ChatRoomRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final UserService userService;

    public List<ChatRoomResponse> getUserRooms(String email) {
        User current = userService.findByEmail(email);
        return chatRoomRepository.findRoomsByUserId(current.getId())
                .stream()
                .map(room -> toChatRoomResponse(room, current.getId()))
                .toList();
    }

    public ChatRoomResponse getOrCreatePrivateRoom(String email, Long targetUserId) {
        User current = userService.findByEmail(email);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        return chatRoomRepository
                .findPrivateRoomBetween(current.getId(), target.getId(), RoomType.PRIVATE)
                .map(r -> toChatRoomResponse(r, current.getId()))
                .orElseGet(() -> {
                    ChatRoom room = ChatRoom.builder()
                            .type(RoomType.PRIVATE)
                            .build();
                    room.getMembers().add(current);
                    room.getMembers().add(target);
                    current.getChatRooms().add(room);
                    target.getChatRooms().add(room);
                    chatRoomRepository.save(room);
                    return toChatRoomResponse(room, current.getId());
                });
    }

    public ChatRoomResponse createGroup(String email, CreateGroupRequest req) {
        User creator = userService.findByEmail(email);

        List<User> members = userRepository.findAllById(req.getMemberIds());
        members.add(creator);

        ChatRoom room = ChatRoom.builder()
                .type(RoomType.GROUP)
                .name(req.getName())
                .description(req.getDescription())
                .createdBy(creator.getId())
                .build();

        members.forEach(m -> {
            room.getMembers().add(m);
            m.getChatRooms().add(room);
        });

        chatRoomRepository.save(room);
        return toChatRoomResponse(room, creator.getId());
    }

    private ChatRoomResponse toChatRoomResponse(ChatRoom room, Long currentUserId) {
        var lastMsg = messageRepository.findLatestMessage(room.getId())
                .map(m -> MessageResponse.builder()
                        .id(m.getId())
                        .content(m.getContent())
                        .type(m.getType())
                        .sentAt(m.getSentAt())
                        .sender(userService.toUserResponse(m.getSender()))
                        .build())
                .orElse(null);

        long unread = messageRepository.countUnread(room.getId(), currentUserId, MessageStatus.READ);

        List<com.chatapp.dto.response.UserResponse> memberResponses = room.getMembers().stream()
                .map(userService::toUserResponse)
                .toList();

        ChatRoomResponse.ChatRoomResponseBuilder builder = ChatRoomResponse.builder()
                .id(room.getId())
                .type(room.getType())
                .members(memberResponses)
                .lastMessage(lastMsg)
                .unreadCount(unread);

        if (room.getType() == RoomType.GROUP) {
            builder.name(room.getName())
                   .groupIcon(room.getGroupIcon())
                   .description(room.getDescription());
        } else {
            User other = room.getOtherMember(currentUserId);
            if (other != null) builder.otherUser(userService.toUserResponse(other));
        }

        return builder.build();
    }
}
