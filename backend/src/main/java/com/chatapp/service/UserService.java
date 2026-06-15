package com.chatapp.service;

import com.chatapp.dto.response.UserResponse;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    public UserResponse getMe(String email) {
        return toUserResponse(findByEmail(email));
    }

    public List<UserResponse> searchUsers(String query, String currentEmail) {
        User current = findByEmail(currentEmail);
        return userRepository.searchUsers(query, current.getId())
                .stream().map(this::toUserResponse).toList();
    }

    public UserResponse updateProfile(String email, String name, String about) {
        User user = findByEmail(email);
        if (name != null) user.setName(name);
        if (about != null) user.setAbout(about);
        userRepository.save(user);
        return toUserResponse(user);
    }

    public UserResponse uploadAvatar(String email, MultipartFile file) throws IOException {
        User user = findByEmail(email);
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("uploads/avatars");
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(filename));
        user.setProfilePic("/uploads/avatars/" + filename);
        userRepository.save(user);
        return toUserResponse(user);
    }

    public void setOnline(Long userId, boolean online) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(online);
            if (!online) user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
            // Mirror in Redis for fast WebSocket reads
            redisTemplate.opsForValue().set("user:online:" + userId, online ? "1" : "0");
        });
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .mobile(user.getMobile())
                .profilePic(user.getProfilePic())
                .online(user.isOnline())
                .lastSeen(user.getLastSeen())
                .about(user.getAbout())
                .build();
    }
}
