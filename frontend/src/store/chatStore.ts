import { create } from 'zustand';
import type { User, ChatRoom, Message } from '../types';

interface ChatState {
  // Auth
  currentUser: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  // Rooms
  rooms: ChatRoom[];
  setRooms: (rooms: ChatRoom[]) => void;
  upsertRoom: (room: ChatRoom) => void;

  // Active chat
  activeRoomId: number | null;
  setActiveRoom: (id: number | null) => void;

  // Messages per room
  messages: Record<number, Message[]>;
  setMessages: (roomId: number, msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  removeMessage: (roomId: number, messageId: number) => void;

  // Reply
  replyTo: Message | null;
  setReplyTo: (msg: Message | null) => void;

  // Typing indicators
  typing: Record<number, string[]>;
  setTyping: (roomId: number, userName: string, isTyping: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Profile panel
  showProfile: boolean;
  setShowProfile: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUser: null,
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ currentUser: user, token });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, token: null });
  },

  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  upsertRoom: (room) => set((s) => {
    const existing = s.rooms.findIndex((r) => r.id === room.id);
    if (existing >= 0) {
      const next = [...s.rooms];
      next[existing] = room;
      return { rooms: next };
    }
    return { rooms: [room, ...s.rooms] };
  }),

  activeRoomId: null,
  setActiveRoom: (id) => set({ activeRoomId: id }),

  messages: {},
  setMessages: (roomId, msgs) => set((s) => ({ messages: { ...s.messages, [roomId]: msgs } })),
  addMessage: (msg) => set((s) => {
    const prev = s.messages[msg.roomId] ?? [];
    const rooms = s.rooms.map((r) =>
      r.id === msg.roomId
        ? { ...r, lastMessage: msg, unreadCount: s.activeRoomId === msg.roomId ? 0 : r.unreadCount + 1 }
        : r
    );
    return {
      messages: { ...s.messages, [msg.roomId]: [...prev, msg] },
      rooms,
    };
  }),
  removeMessage: (roomId, messageId) => set((s) => ({
    messages: {
      ...s.messages,
      [roomId]: (s.messages[roomId] ?? []).filter((m) => m.id !== messageId),
    },
  })),

  replyTo: null,
  setReplyTo: (msg) => set({ replyTo: msg }),

  typing: {},
  setTyping: (roomId, userName, isTyping) => set((s) => {
    const current = s.typing[roomId] ?? [];
    const next = isTyping
      ? current.includes(userName) ? current : [...current, userName]
      : current.filter((n) => n !== userName);
    return { typing: { ...s.typing, [roomId]: next } };
  }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  showProfile: false,
  setShowProfile: (v) => set({ showProfile: v }),
}));
