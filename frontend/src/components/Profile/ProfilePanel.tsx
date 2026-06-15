import { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { userApi } from '../../services/api';
import { useChatStore } from '../../store/chatStore';

export default function ProfilePanel() {
  const { currentUser, setAuth, token, setShowProfile } = useChatStore();
  const [name, setName] = useState(currentUser?.name ?? '');
  const [about, setAbout] = useState(currentUser?.about ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  if (!currentUser || !token) return null;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await userApi.updateProfile(name, about);
      setAuth(updated, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = await userApi.uploadAvatar(file);
    setAuth(updated, token);
    e.target.value = '';
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <span style={styles.title}>Edit Profile</span>
          <button style={styles.iconBtn} onClick={() => setShowProfile(false)}><X size={20} color="#8696a0" /></button>
        </div>

        {/* Avatar */}
        <div style={styles.avatarSection}>
          <div style={styles.avatarWrap} onClick={() => avatarRef.current?.click()} title="Change photo">
            {currentUser.profilePic
              ? <img src={currentUser.profilePic} alt="" style={styles.avatarImg} />
              : <span style={styles.avatarText}>{currentUser.name[0]}</span>}
            <div style={styles.avatarOverlay}><Camera size={20} color="#fff" /></div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
        </div>

        {/* Fields */}
        <div style={styles.field}>
          <label style={styles.label}>Your Name</label>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>About</label>
          <textarea style={styles.textarea} value={about} onChange={(e) => setAbout(e.target.value)} rows={3} maxLength={139} />
          <span style={styles.charCount}>{about.length}/139</span>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input style={{ ...styles.input, color: '#8696a0' }} value={currentUser.email} readOnly />
        </div>

        {currentUser.mobile && (
          <div style={styles.field}>
            <label style={styles.label}>Mobile</label>
            <input style={{ ...styles.input, color: '#8696a0' }} value={currentUser.mobile} readOnly />
          </div>
        )}

        <button style={styles.saveBtn} onClick={save} disabled={saving || !name.trim()}>
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  panel: { background: '#202c33', borderRadius: 16, padding: '1.5rem', width: 360, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#e9edef', fontWeight: 700, fontSize: '1rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  avatarSection: { display: 'flex', justifyContent: 'center' },
  avatarWrap: { position: 'relative', width: 80, height: 80, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { color: '#e9edef', fontSize: '2rem', fontWeight: 700 },
  avatarOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: '#00a884', fontSize: '0.8rem', fontWeight: 600 },
  input: { padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #2a3942', background: '#2a3942', color: '#e9edef', fontSize: '0.9rem', outline: 'none' },
  textarea: { padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #2a3942', background: '#2a3942', color: '#e9edef', fontSize: '0.9rem', outline: 'none', resize: 'none', fontFamily: 'inherit' },
  charCount: { color: '#8696a0', fontSize: '0.75rem', textAlign: 'right' },
  saveBtn: { padding: '0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#00a884', color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginTop: 4 },
};
