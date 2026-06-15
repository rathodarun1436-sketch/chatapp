import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Message, TypingEvent, ReadReceiptEvent, DeleteEvent } from '../types';

type MessageHandler = (msg: Message) => void;
type TypingHandler = (event: TypingEvent) => void;
type ReadHandler = (event: ReadReceiptEvent) => void;
type DeleteHandler = (event: DeleteEvent) => void;

class WebSocketService {
  private client: Client | null = null;
  private roomSubs: Map<number, { msg: () => void; typing: () => void; read: () => void; delete: () => void }> = new Map();

  connect(token: string, onConnected?: () => void) {
    // In production VITE_WS_URL = https://your-app.onrender.com
    // In development empty string → Vite proxy handles /ws
    const wsBase = import.meta.env.VITE_WS_URL ?? '';
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${wsBase}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => onConnected?.(),
      onStompError: (frame) => console.error('STOMP error', frame),
    });
    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
    this.client = null;
    this.roomSubs.clear();
  }

  subscribeRoom(
    roomId: number,
    onMessage: MessageHandler,
    onTyping: TypingHandler,
    onRead: ReadHandler,
    onDelete: DeleteHandler
  ) {
    if (!this.client?.connected || this.roomSubs.has(roomId)) return;

    const msgSub = this.client.subscribe(`/topic/room.${roomId}`, (frame) => {
      onMessage(JSON.parse(frame.body) as Message);
    });
    const typingSub = this.client.subscribe(`/topic/room.${roomId}.typing`, (frame) => {
      onTyping(JSON.parse(frame.body) as TypingEvent);
    });
    const readSub = this.client.subscribe(`/topic/room.${roomId}.read`, (frame) => {
      onRead(JSON.parse(frame.body) as ReadReceiptEvent);
    });
    const deleteSub = this.client.subscribe(`/topic/room.${roomId}.delete`, (frame) => {
      onDelete(JSON.parse(frame.body) as DeleteEvent);
    });

    this.roomSubs.set(roomId, {
      msg: () => msgSub.unsubscribe(),
      typing: () => typingSub.unsubscribe(),
      read: () => readSub.unsubscribe(),
      delete: () => deleteSub.unsubscribe(),
    });
  }

  unsubscribeRoom(roomId: number) {
    const subs = this.roomSubs.get(roomId);
    if (subs) {
      subs.msg(); subs.typing(); subs.read(); subs.delete();
      this.roomSubs.delete(roomId);
    }
  }

  sendMessage(roomId: number, content: string, replyToMessageId?: number) {
    this.client?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId, content, type: 'TEXT', replyToMessageId }),
    });
  }

  sendTyping(roomId: number, typing: boolean) {
    this.client?.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId, typing }),
    });
  }

  sendRead(roomId: number) {
    this.client?.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ roomId }),
    });
  }
}

export const wsService = new WebSocketService();
