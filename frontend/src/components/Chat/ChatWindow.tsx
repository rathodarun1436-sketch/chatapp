import { useEffect, useRef, useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { chatApi } from '../../services/api';
import { wsService } from '../../services/websocket';
import { useChatStore } from '../../store/chatStore';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { Message } from '../../types';

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function ChatWindow() {
  const { activeRoomId, rooms, messages, setMessages, addMessage, setTyping, removeMessage, token, currentUser } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const room = rooms.find((r) => r.id === activeRoomId);
  const roomMessages = activeRoomId ? (messages[activeRoomId] ?? []) : [];

  // Group messages by date for dividers
  const grouped = useMemo(() => {
    const groups: { dateLabel: string; msgs: Message[] }[] = [];
    for (const msg of roomMessages) {
      const label = formatDateLabel(msg.sentAt);
      const last = groups[groups.length - 1];
      if (last && last.dateLabel === label) last.msgs.push(msg);
      else groups.push({ dateLabel: label, msgs: [msg] });
    }
    return groups;
  }, [roomMessages]);

  useEffect(() => {
    if (!activeRoomId || !token) return;

    setLoading(true);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);

    chatApi.getMessages(activeRoomId).then((msgs) => {
      setMessages(activeRoomId, msgs);
      setLoading(false);
      chatApi.markRead(activeRoomId);
    });

    wsService.subscribeRoom(
      activeRoomId,
      (msg: Message) => {
        addMessage(msg);
        if (msg.sender.id !== currentUser?.id) wsService.sendRead(activeRoomId);
      },
      (evt) => setTyping(activeRoomId, evt.userName, evt.typing),
      (_evt) => { /* update read status */ },
      (evt) => removeMessage(evt.roomId, evt.messageId)
    );

    return () => wsService.unsubscribeRoom(activeRoomId);
  }, [activeRoomId]);

  useEffect(() => {
    if (!searchOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length, searchOpen]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const all = await chatApi.search(q);
    setSearchResults(all.filter((m) => m.roomId === activeRoomId));
  };

  if (!activeRoomId || !room) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyInner}>
          <div style={styles.emptyIcon}>💬</div>
          <h2 style={styles.emptyTitle}>WhatsApp Web</h2>
          <p style={styles.emptyText}>Send and receive messages without keeping your phone online.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.window}>
      <ChatHeader room={room} onSearchToggle={() => setSearchOpen((v) => !v)} />

      {/* In-chat search bar */}
      {searchOpen && (
        <div style={styles.searchBar}>
          <Search size={16} color="#8696a0" />
          <input
            style={styles.searchInput}
            placeholder="Search messages…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {searchQuery && <button style={styles.clearBtn} onClick={() => { setSearchQuery(''); setSearchResults([]); }}><X size={14} color="#8696a0" /></button>}
          <button style={styles.clearBtn} onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}><X size={16} color="#8696a0" /></button>
        </div>
      )}

      {/* Search results view */}
      {searchOpen && searchQuery ? (
        <div style={styles.messageArea}>
          {searchResults.length === 0
            ? <p style={styles.loading}>No messages found</p>
            : searchResults.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isOwn={msg.sender.id === currentUser?.id} />
              ))
          }
        </div>
      ) : (
        <div style={styles.messageArea}>
          {loading && <p style={styles.loading}>Loading…</p>}
          {grouped.map(({ dateLabel, msgs }) => (
            <div key={dateLabel}>
              <div style={styles.dateDivider}>
                <span style={styles.dateDividerText}>{dateLabel}</span>
              </div>
              {msgs.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isOwn={msg.sender.id === currentUser?.id} />
              ))}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <MessageInput roomId={activeRoomId} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  window: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: '#0b141a' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b141a' },
  emptyInner: { textAlign: 'center', color: '#8696a0' },
  emptyIcon: { fontSize: '4rem', marginBottom: '1rem' },
  emptyTitle: { color: '#e9edef', fontWeight: 300, fontSize: '1.75rem', margin: '0 0 0.5rem' },
  emptyText: { fontSize: '0.9rem', maxWidth: 340 },
  messageArea: { flex: 1, overflowY: 'auto', padding: '1rem 6%', display: 'flex', flexDirection: 'column', gap: 2 },
  loading: { textAlign: 'center', color: '#8696a0', fontSize: '0.9rem' },
  dateDivider: { display: 'flex', justifyContent: 'center', margin: '12px 0 6px' },
  dateDividerText: { background: '#182229', color: '#8696a0', fontSize: '0.75rem', padding: '4px 12px', borderRadius: 12 },
  searchBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 1rem', background: '#202c33', borderBottom: '1px solid #2a3942' },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e9edef', fontSize: '0.9rem' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
};
