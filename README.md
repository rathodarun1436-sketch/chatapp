# ChatApp — WhatsApp Clone

Full-stack real-time chat application built with Java Spring Boot + React.

## Features
- JWT Authentication (register / login)
- One-to-one & Group chats
- Real-time messaging via WebSocket (STOMP)
- Online / Offline status (Redis)
- Typing indicators
- Read receipts (✓ / ✓✓)
- File & image sharing (multipart upload)
- Voice notes (MediaRecorder API)
- Message search
- Video/Audio calling (WebRTC — hook into ChatHeader buttons)

## Stack

| Layer | Tech |
|---|---|
| Backend | Java 21, Spring Boot 3.2, Spring Security, Spring WebSocket |
| Auth | JWT (jjwt 0.12) |
| Database | PostgreSQL + Spring Data JPA |
| Realtime | WebSocket + STOMP |
| Caching / Online status | Redis |
| Messaging | Apache Kafka (notifications pipeline) |
| Frontend | React 18, TypeScript, Vite |
| State | Zustand |
| WS Client | @stomp/stompjs + SockJS |

## Quick Start

### Prerequisites
- Java 21
- Node 20+
- PostgreSQL running on port 5432
- Redis running on port 6379

### Backend

```bash
cd backend

# Edit src/main/resources/application.yml
# Set: spring.datasource.password, jwt.secret

mvn spring-boot:run
# Starts on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

## REST API Summary

| Method | URL | Description |
|---|---|---|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/users/me | Current user |
| GET | /api/users/search?query= | Search users |
| GET | /api/chat/rooms | All chat rooms |
| POST | /api/chat/rooms/private/{id} | Open/create private chat |
| POST | /api/chat/rooms/group | Create group |
| GET | /api/chat/rooms/{id}/messages | Paginated messages |
| POST | /api/chat/messages | Send text message |
| POST | /api/chat/rooms/{id}/upload | Upload file/image/voice |
| POST | /api/chat/rooms/{id}/read | Mark messages read |
| GET | /api/chat/search?query= | Search messages |

## WebSocket Events

Connect to: `ws://localhost:8080/ws`

| Destination | Direction | Payload |
|---|---|---|
| /app/chat.send | Client → Server | `{ roomId, content, type }` |
| /app/chat.typing | Client → Server | `{ roomId, typing }` |
| /app/chat.read | Client → Server | `{ roomId }` |
| /topic/room.{id} | Server → Client | Message object |
| /topic/room.{id}.typing | Server → Client | TypingEvent |
| /topic/room.{id}.read | Server → Client | ReadReceiptEvent |
