import { useState } from 'react';
import { Phone, Video, Search, X, Users } from 'lucide-react';
import type { ChatRoom } from '../../types';
import { useChatStore } from '../../store/chatStore';

interface Props {
  room: ChatRoom;
  onSearchToggle: () => void;
}

export default function ChatHeader({ room, onSearchToggle }: Props) {
  const { typing } = useChatStore();
  const [showInfo, setShowInfo] = useState(false);
  const typingUsers = typing[room.id] ?? [];

  const name = room.type === 'GROUP' ? room.name ?? 'Group' : room.otherUser?.name ?? 'Unknown';
  const avatar = room.type === 'GROUP' ? room.groupIcon : room.otherUser?.profilePic;
  const isOnline = room.type === 'PRIVATE' && room.otherUser?.online;

  let status = '';
  if (typingUsers.length > 0) status = typingUsers.join(', ') + ' typing…';
  else if (isOnline) status = 'online';
  else if (room.otherUser?.lastSeen) {
    const d = new Date(room.otherUser.lastSeen);
    status = 'last seen ' + d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } else if (room.type === 'GROUP') {
    status = `${room.members.length} member${room.members.length !== 1 ? 's' : ''}`;
  }

  return (
    <>
      <div style={styles.header}>
        <div style={styles.avatarWrap} onClick={() => setShowInfo((v) => !v)} title="View info">
          <div style={styles.avatar}>
            {avatar ? <img src={avatar} alt="" style={styles.avatarImg} /> : <span style={styles.avatarText}>{name[0]}</span>}
          </div>
        </div>
        <div style={styles.info} onClick={() => setShowInfo((v) => !v)}>
          <span style={styles.name}>{name}</span>
          {status && <span style={{ ...styles.status, color: typingUsers.length > 0 ? '#00a884' : '#8696a0' }}>{status}</span>}
        </div>
        <div style={styles.actions}>
          <button style={styles.iconBtn} title="Voice call"><Phone size={20} color="#8696a0" /></button>
          <button style={styles.iconBtn} title="Video call"><Video size={20} color="#8696a0" /></button>
          <button style={styles.iconBtn} onClick={onSearchToggle} title="Search messages"><Search size={20} color="#8696a0" /></button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div style={styles.infoPanel}>
          <div style={styles.infoPanelHeader}>
            <span style={styles.infoPanelTitle}>{room.type === 'GROUP' ? 'Group Info' : 'Contact Info'}</span>
            <button style={styles.iconBtn} onClick={() => setShowInfo(false)}><X size={18} color="#8696a0" /></button>
          </div>

          {/* Avatar + name */}
          <div style={styles.infoCenterBlock}>
            <div style={styles.infoAvatar}>
              {avatar ? <img src={avatar} alt="" style={styles.avatarImg} /> : <span style={styles.infoAvatarText}>{name[0]}</span>}
            </div>
            <span style={styles.infoName}>{name}</span>
            {room.type === 'PRIVATE' && room.otherUser && (
              <span style={styles.infoSub}>{room.otherUser.email}</span>
            )}
            {room.type === 'GROUP' && room.description && (
              <span style={styles.infoSub}>{room.description}</span>
            )}
          </div>

          {/* About (private chat) */}
          {room.type === 'PRIVATE' && room.otherUser?.about && (
            <div style={styles.infoSection}>
              <span style={styles.infoLabel}>About</span>
              <span style={styles.infoValue}>{room.otherUser.about}</span>
            </div>
          )}

          {/* Members (group) */}
          {room.type === 'GROUP' && (
            <div style={styles.infoSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Users size={15} color="#8696a0" />
                <span style={styles.infoLabel}>{room.members.length} Members</span>
              </div>
              {room.members.map((m) => (
                <div key={m.id} style={styles.memberRow}>
                  <div style={styles.memberAvatar}>{m.name[0]}</div>
                  <div>
                    <div style={styles.memberName}>{m.name}</div>
                    <div style={styles.memberEmail}>{m.email}</div>
                  </div>
                  {m.online && <span style={styles.onlineDot} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 1rem', background: '#202c33', borderBottom: '1px solid #2a3942', cursor: 'default' },
  avatarWrap: { cursor: 'pointer', flexShrink: 0 },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { color: '#e9edef', fontWeight: 600 },
  info: { flex: 1, display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  name: { color: '#e9edef', fontWeight: 600, fontSize: '0.95rem' },
  status: { fontSize: '0.78rem' },
  actions: { display: 'flex', gap: 4 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8 },
  // Info panel
  infoPanel: { background: '#202c33', borderBottom: '1px solid #2a3942', maxHeight: 380, overflowY: 'auto' },
  infoPanelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid #2a3942' },
  infoPanelTitle: { color: '#e9edef', fontWeight: 600, fontSize: '0.95rem' },
  infoCenterBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', gap: 6 },
  infoAvatar: { width: 64, height: 64, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  infoAvatarText: { color: '#e9edef', fontWeight: 700, fontSize: '1.5rem' },
  infoName: { color: '#e9edef', fontWeight: 700, fontSize: '1.05rem' },
  infoSub: { color: '#8696a0', fontSize: '0.85rem', textAlign: 'center' },
  infoSection: { padding: '0.5rem 1rem 0.75rem', borderTop: '1px solid #2a3942' },
  infoLabel: { color: '#8696a0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoValue: { color: '#e9edef', fontSize: '0.9rem', marginTop: 4, display: 'block' },
  memberRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '0.45rem 0', position: 'relative' },
  memberAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e9edef', fontWeight: 600, flexShrink: 0 },
  memberName: { color: '#e9edef', fontSize: '0.88rem', fontWeight: 600 },
  memberEmail: { color: '#8696a0', fontSize: '0.78rem' },
  onlineDot: { position: 'absolute', right: 0, width: 9, height: 9, borderRadius: '50%', background: '#25d366', border: '2px solid #202c33' },
};
