import { useState } from 'react';
import { Reply, Trash2, Copy, X } from 'lucide-react';
import type { Message } from '../../types';
import { chatApi } from '../../services/api';
import { useChatStore } from '../../store/chatStore';

interface Props {
  message: Message;
  isOwn: boolean;
}

// Full-screen image lightbox
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div style={lb.overlay} onClick={onClose}>
      <button style={lb.close} onClick={onClose}><X size={24} color="#fff" /></button>
      <img
        src={url}
        alt="preview"
        style={lb.img}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

const lb: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, cursor: 'zoom-out',
  },
  close: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(255,255,255,0.15)', border: 'none',
    borderRadius: '50%', width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  img: {
    maxWidth: '90vw', maxHeight: '90vh',
    borderRadius: 8, objectFit: 'contain', cursor: 'default',
  },
};

export default function MessageBubble({ message, isOwn }: Props) {
  const [hovered, setHovered] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const { setReplyTo, removeMessage } = useChatStore();
  const time = new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;
    await chatApi.deleteMessage(message.id);
    removeMessage(message.roomId, message.id);
  };

  const handleCopy = () => {
    if (message.content) navigator.clipboard.writeText(message.content);
  };

  if (message.type === 'SYSTEM') {
    return <div style={styles.systemBubble}>{message.content}</div>;
  }

  const bubble: React.CSSProperties = {
    ...styles.bubble,
    background: isOwn ? '#005c4b' : '#202c33',
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    borderRadius: isOwn ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
  };

  const renderContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <div style={styles.imageWrap} onClick={() => setLightboxUrl(message.fileUrl ?? null)}>
            <img
              src={message.fileUrl}
              alt={message.fileName ?? 'image'}
              style={styles.image}
            />
            <div style={styles.imageOverlay}>🔍</div>
          </div>
        );
      case 'VOICE':
        return <audio controls style={styles.audio}><source src={message.fileUrl} /></audio>;
      case 'VIDEO':
        return <video src={message.fileUrl} controls style={styles.video} />;
      case 'FILE':
        return (
          <a href={message.fileUrl} download={message.fileName} style={styles.fileLink}>
            📎 {message.fileName ?? 'Download file'}
          </a>
        );
      default:
        return <span style={styles.text}>{message.content}</span>;
    }
  };

  return (
    <>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <div
        style={{ ...styles.wrapper, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Action buttons */}
        {hovered && (
          <div style={{ ...styles.actions, order: isOwn ? 0 : 1 }}>
            <button style={styles.actionBtn} onClick={() => setReplyTo(message)} title="Reply">
              <Reply size={14} color="#8696a0" />
            </button>
            {message.content && (
              <button style={styles.actionBtn} onClick={handleCopy} title="Copy">
                <Copy size={14} color="#8696a0" />
              </button>
            )}
            {isOwn && (
              <button style={styles.actionBtn} onClick={handleDelete} title="Delete">
                <Trash2 size={14} color="#ef4444" />
              </button>
            )}
          </div>
        )}

        <div style={{ ...bubble, order: isOwn ? 1 : 0 }}>
          {/* Reply preview */}
          {message.replyToId && (
            <div style={styles.replyPreview}>
              <span style={styles.replyName}>{message.replyToSenderName}</span>
              <span style={styles.replyText}>{message.replyToContent}</span>
            </div>
          )}

          {renderContent()}

          <div style={styles.meta}>
            <span style={styles.time}>{time}</span>
            {isOwn && (
              <span style={{ ...styles.tick, color: message.status === 'READ' ? '#53bdeb' : '#8696a0' }}>
                {message.status === 'SENT' ? '✓' : '✓✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 2 },
  bubble: { maxWidth: '65%', padding: '6px 10px 4px', wordBreak: 'break-word' },
  actions: { display: 'flex', gap: 2, alignItems: 'center', marginBottom: 4 },
  actionBtn: { background: '#202c33', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 6px', display: 'flex', alignItems: 'center' },
  replyPreview: { background: 'rgba(0,0,0,0.2)', borderLeft: '3px solid #00a884', borderRadius: '4px 4px 0 0', padding: '4px 8px', marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 1 },
  replyName: { color: '#00a884', fontSize: '0.78rem', fontWeight: 600 },
  replyText: { color: '#8696a0', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 },
  text: { color: '#e9edef', fontSize: '0.93rem', lineHeight: 1.4 },
  meta: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time: { color: '#8696a0', fontSize: '0.7rem' },
  tick: { fontSize: '0.75rem' },
  imageWrap: { position: 'relative', cursor: 'pointer', display: 'inline-block' },
  image: { maxWidth: 240, borderRadius: 8, display: 'block' },
  imageOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', opacity: 0, transition: 'all 0.2s', borderRadius: 8 },
  audio: { maxWidth: 240 },
  video: { maxWidth: 240, borderRadius: 8 },
  fileLink: { color: '#53bdeb', fontSize: '0.9rem' },
  systemBubble: { alignSelf: 'center', background: 'rgba(17,27,33,0.7)', color: '#8696a0', fontSize: '0.8rem', padding: '4px 12px', borderRadius: 8, margin: '4px auto' },
};
