import { useEffect, useState } from 'react';
import { Search, LogOut, MessageCircle, Plus, X, Check } from 'lucide-react';
import { chatApi, userApi } from '../../services/api';
import { useChatStore } from '../../store/chatStore';
import type { User } from '../../types';

export default function Sidebar() {
  const { rooms, setRooms, setActiveRoom, activeRoomId, currentUser, clearAuth, upsertRoom, searchQuery, setSearchQuery, setShowProfile } = useChatStore();
  const [searchUsers, setSearchUsers] = useState<User[]>([]);

  // Group creation state
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    chatApi.getRooms().then(setRooms);
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchUsers([]); return; }
    const users = await userApi.search(q);
    setSearchUsers(users);
  };

  const openChat = async (user: User) => {
    const room = await chatApi.openPrivate(user.id);
    upsertRoom(room);
    setActiveRoom(room.id);
    setSearchQuery('');
    setSearchUsers([]);
  };

  const handleMemberSearch = async (q: string) => {
    setMemberSearch(q);
    if (!q.trim()) { setMemberResults([]); return; }
    const users = await userApi.search(q);
    setMemberResults(users.filter(u => !selectedMembers.find(m => m.id === u.id)));
  };

  const toggleMember = (user: User) => {
    setSelectedMembers(prev =>
      prev.find(m => m.id === user.id)
        ? prev.filter(m => m.id !== user.id)
        : [...prev, user]
    );
    setMemberResults(prev => prev.filter(u => u.id !== user.id));
    setMemberSearch('');
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setCreating(true);
    try {
      const room = await chatApi.createGroup(
        groupName.trim(),
        groupDesc.trim(),
        selectedMembers.map(m => m.id)
      );
      upsertRoom(room);
      setActiveRoom(room.id);
      setShowGroupForm(false);
      setGroupName('');
      setGroupDesc('');
      setSelectedMembers([]);
      setMemberSearch('');
      setMemberResults([]);
    } finally {
      setCreating(false);
    }
  };

  const closeGroupForm = () => {
    setShowGroupForm(false);
    setGroupName('');
    setGroupDesc('');
    setSelectedMembers([]);
    setMemberSearch('');
    setMemberResults([]);
  };

  const displayRooms = searchQuery ? [] : rooms;

  const getRoomName = (room: typeof rooms[0]) =>
    room.type === 'GROUP' ? room.name ?? 'Group' : room.otherUser?.name ?? 'Unknown';

  const getRoomAvatar = (room: typeof rooms[0]) =>
    room.type === 'GROUP' ? room.groupIcon : room.otherUser?.profilePic;

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatar} onClick={() => setShowProfile(true)} title="Edit profile">
          {currentUser?.profilePic
            ? <img src={currentUser.profilePic} alt="" style={styles.avatarImg} />
            : <span style={styles.avatarText}>{currentUser?.name?.[0]}</span>}
        </div>
        <div style={styles.appName}>ChatApp</div>
        <button onClick={() => setShowGroupForm(true)} style={styles.iconBtn} title="New Group">
          <Plus size={18} color="#8696a0" />
        </button>
        <button onClick={clearAuth} style={styles.iconBtn} title="Logout">
          <LogOut size={18} color="#8696a0" />
        </button>
      </div>

      {/* Group creation form */}
      {showGroupForm && (
        <div style={styles.groupForm}>
          <div style={styles.groupFormHeader}>
            <span style={styles.groupFormTitle}>New Group</span>
            <button onClick={closeGroupForm} style={styles.iconBtn}><X size={18} color="#8696a0" /></button>
          </div>

          <input
            style={styles.groupInput}
            placeholder="Group name *"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
          />
          <input
            style={styles.groupInput}
            placeholder="Description (optional)"
            value={groupDesc}
            onChange={e => setGroupDesc(e.target.value)}
          />

          {/* Selected members chips */}
          {selectedMembers.length > 0 && (
            <div style={styles.chips}>
              {selectedMembers.map(m => (
                <span key={m.id} style={styles.chip}>
                  {m.name}
                  <button onClick={() => setSelectedMembers(prev => prev.filter(x => x.id !== m.id))} style={styles.chipRemove}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Member search */}
          <div style={styles.searchBox}>
            <Search size={14} color="#8696a0" style={{ flexShrink: 0 }} />
            <input
              style={styles.searchInput}
              placeholder="Search people to add"
              value={memberSearch}
              onChange={e => handleMemberSearch(e.target.value)}
            />
          </div>

          {memberResults.map(u => (
            <div key={u.id} style={styles.memberItem} onClick={() => toggleMember(u)}>
              <div style={styles.memberAvatar}>{u.name[0]}</div>
              <div style={styles.roomInfo}>
                <span style={styles.roomName}>{u.name}</span>
                <span style={styles.lastMsg}>{u.email}</span>
              </div>
              <Check size={16} color="#00a884" />
            </div>
          ))}

          <button
            style={{ ...styles.createBtn, opacity: (!groupName.trim() || selectedMembers.length === 0) ? 0.5 : 1 }}
            onClick={createGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0 || creating}
          >
            {creating ? 'Creating…' : `Create Group (${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      )}

      {/* Search */}
      {!showGroupForm && (
        <>
          <div style={styles.searchBox}>
            <Search size={16} color="#8696a0" style={{ flexShrink: 0 }} />
            <input
              style={styles.searchInput}
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* User search results */}
          {searchUsers.length > 0 && (
            <div>
              <p style={styles.sectionLabel}>Users</p>
              {searchUsers.map((u) => (
                <div key={u.id} style={styles.roomItem} onClick={() => openChat(u)}>
                  <div style={styles.roomAvatar}>
                    {u.profilePic ? <img src={u.profilePic} alt="" style={styles.avatarImg} /> : <span>{u.name[0]}</span>}
                  </div>
                  <div style={styles.roomInfo}>
                    <span style={styles.roomName}>{u.name}</span>
                    <span style={styles.lastMsg}>{u.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat list */}
          {!searchQuery && (
            <div style={styles.roomList}>
              {displayRooms.map((room) => (
                <div
                  key={room.id}
                  style={{ ...styles.roomItem, ...(activeRoomId === room.id ? styles.roomActive : {}) }}
                  onClick={() => setActiveRoom(room.id)}
                >
                  <div style={styles.roomAvatar}>
                    {getRoomAvatar(room)
                      ? <img src={getRoomAvatar(room)} alt="" style={styles.avatarImg} />
                      : <span>{getRoomName(room)[0]}</span>}
                    {room.type === 'PRIVATE' && room.otherUser?.online && <span style={styles.onlineDot} />}
                  </div>
                  <div style={styles.roomInfo}>
                    <div style={styles.roomRow}>
                      <span style={styles.roomName}>{getRoomName(room)}</span>
                      <span style={styles.roomTime}>{formatTime(room.lastMessage?.sentAt)}</span>
                    </div>
                    <div style={styles.roomRow}>
                      <span style={styles.lastMsg}>
                        {room.lastMessage?.type === 'TEXT'
                          ? room.lastMessage.content
                          : room.lastMessage?.type === 'IMAGE' ? '📷 Photo'
                          : room.lastMessage?.type === 'VOICE' ? '🎤 Voice note'
                          : room.lastMessage?.type === 'FILE' ? `📎 ${room.lastMessage.fileName}`
                          : ''}
                      </span>
                      {room.unreadCount > 0 && (
                        <span style={styles.badge}>{room.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {displayRooms.length === 0 && (
                <div style={styles.empty}>
                  <MessageCircle size={48} color="#2a3942" />
                  <p>Search for someone to start chatting</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { width: 360, minWidth: 300, height: '100vh', display: 'flex', flexDirection: 'column', background: '#111b21', borderRight: '1px solid #2a3942' },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#202c33' },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { color: '#e9edef', fontWeight: 600 },
  appName: { flex: 1, color: '#e9edef', fontWeight: 700, fontSize: '1.05rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 6 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, margin: '0.5rem 0.75rem', padding: '0.5rem 0.75rem', background: '#202c33', borderRadius: 8 },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e9edef', fontSize: '0.9rem' },
  sectionLabel: { color: '#8696a0', fontSize: '0.8rem', padding: '0.25rem 1rem', margin: 0 },
  roomList: { flex: 1, overflowY: 'auto' },
  roomItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 1rem', cursor: 'pointer', borderBottom: '1px solid #1f2c33' },
  roomActive: { background: '#2a3942' },
  roomAvatar: { position: 'relative', width: 46, height: 46, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', flexShrink: 0, color: '#e9edef', fontSize: '1.1rem', fontWeight: 600 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#25d366', border: '2px solid #111b21' },
  roomInfo: { flex: 1, minWidth: 0 },
  roomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { color: '#e9edef', fontWeight: 600, fontSize: '0.95rem' },
  roomTime: { color: '#8696a0', fontSize: '0.75rem' },
  lastMsg: { color: '#8696a0', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 },
  badge: { background: '#00a884', color: '#fff', borderRadius: 12, padding: '1px 6px', fontSize: '0.72rem', fontWeight: 700 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '4rem', color: '#8696a0', fontSize: '0.9rem' },
  // Group form styles
  groupForm: { display: 'flex', flexDirection: 'column', gap: 8, padding: '0.75rem', background: '#111b21', flex: 1, overflowY: 'auto' },
  groupFormHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  groupFormTitle: { color: '#e9edef', fontWeight: 700, fontSize: '1rem' },
  groupInput: { padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #2a3942', background: '#202c33', color: '#e9edef', fontSize: '0.9rem', outline: 'none' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: { display: 'flex', alignItems: 'center', gap: 4, background: '#2a3942', color: '#e9edef', borderRadius: 16, padding: '3px 10px', fontSize: '0.82rem' },
  chipRemove: { background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', display: 'flex', alignItems: 'center', padding: 0 },
  memberItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: 8, background: '#202c33' },
  memberAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e9edef', fontWeight: 600, flexShrink: 0 },
  createBtn: { marginTop: 8, padding: '0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#00a884', color: '#fff', fontWeight: 700, fontSize: '0.9rem' },
};
