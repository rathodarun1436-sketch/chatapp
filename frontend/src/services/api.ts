import axios from 'axios';
import type { AuthResponse, ChatRoom, Message, User } from '../types';

// In production VITE_API_URL = https://your-app.onrender.com
// In development it's empty so the Vite proxy handles /api
const BASE = import.meta.env.VITE_API_URL ?? '';
const api = axios.create({ baseURL: `${BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string, mobile?: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password, mobile }).then((r) => r.data),
};

export const userApi = {
  getMe: () => api.get<User>('/users/me').then((r) => r.data),
  search: (query: string) => api.get<User[]>(`/users/search?query=${query}`).then((r) => r.data),
  updateProfile: (name?: string, about?: string) =>
    api.put<User>('/users/profile', null, { params: { name, about } }).then((r) => r.data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<User>('/users/avatar', form).then((r) => r.data);
  },
};

export const chatApi = {
  getRooms: () => api.get<ChatRoom[]>('/chat/rooms').then((r) => r.data),
  openPrivate: (targetUserId: number) =>
    api.post<ChatRoom>(`/chat/rooms/private/${targetUserId}`).then((r) => r.data),
  createGroup: (name: string, description: string, memberIds: number[]) =>
    api.post<ChatRoom>('/chat/rooms/group', { name, description, memberIds }).then((r) => r.data),
  getMessages: (roomId: number, page = 0, size = 50) =>
    api.get<Message[]>(`/chat/rooms/${roomId}/messages?page=${page}&size=${size}`).then((r) => r.data),
  sendMessage: (roomId: number, content: string, replyToMessageId?: number) =>
    api.post<Message>('/chat/messages', { roomId, content, type: 'TEXT', replyToMessageId }).then((r) => r.data),
  deleteMessage: (messageId: number) =>
    api.delete(`/chat/messages/${messageId}`),
  uploadFile: (roomId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Message>(`/chat/rooms/${roomId}/upload`, form).then((r) => r.data);
  },
  markRead: (roomId: number) => api.post(`/chat/rooms/${roomId}/read`),
  search: (query: string) => api.get<Message[]>(`/chat/search?query=${query}`).then((r) => r.data),
};

export default api;
