export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO' | 'SYSTEM';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';
export type RoomType = 'PRIVATE' | 'GROUP';

export interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  profilePic?: string;
  online: boolean;
  lastSeen?: string;
  about?: string;
}

export interface Message {
  id: number;
  roomId: number;
  sender: User;
  content?: string;
  type: MessageType;
  status: MessageStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readByUserIds: number[];
  sentAt: string;
  replyToId?: number;
  replyToContent?: string;
  replyToSenderName?: string;
}

export interface ChatRoom {
  id: number;
  type: RoomType;
  name?: string;
  groupIcon?: string;
  description?: string;
  otherUser?: User;
  members: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TypingEvent {
  roomId: number;
  userId: number;
  userName: string;
  typing: boolean;
}

export interface ReadReceiptEvent {
  roomId: number;
  userId: number;
}

export interface DeleteEvent {
  roomId: number;
  messageId: number;
}
