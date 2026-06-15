import { useRef, useState } from 'react';
import { Send, Paperclip, Mic, Smile, X } from 'lucide-react';
import { wsService } from '../../services/websocket';
import { chatApi } from '../../services/api';
import { useChatStore } from '../../store/chatStore';

const EMOJIS = [
  '😀','😂','🤣','😊','😇','🥰','😍','🤩','😘','😗','😙','😋',
  '🙂','🤗','🤔','🤭','🤫','😐','😑','🙄','😏','😣','😥','😮',
  '😪','😫','🥱','😴','😌','😛','😜','😝','😒','😓','😔','😕',
  '🙃','😲','😖','😞','😟','😤','😢','😭','😦','😨','😩','🤯',
  '😬','😰','😱','🥵','🥶','😳','😵','😡','😠','🤬','😷','🤒',
  '👋','🤚','✋','👌','✌️','🤞','👍','👎','👊','✊','👏','🙌',
  '🙏','💪','🤝','👀','❤️','🧡','💛','💚','💙','💜','🖤','💔',
  '💕','💞','💓','💗','💖','💘','💝','🔥','✨','⚡','🌈','🌟',
  '⭐','💫','🎉','🎊','🎈','🏆','🥇','💯','🚀','🎁','🍕','🎮',
];

interface Props { roomId: number }

export default function MessageInput({ roomId }: Props) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const { addMessage, replyTo, setReplyTo } = useChatStore();

  const sendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    wsService.sendMessage(roomId, trimmed, replyTo?.id);
    setText('');
    setReplyTo(null);
    setShowEmoji(false);
    wsService.sendTyping(roomId, false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  const onType = (value: string) => {
    setText(value);
    wsService.sendTyping(roomId, true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => wsService.sendTyping(roomId, false), 2000);
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const msg = await chatApi.uploadFile(roomId, file);
    addMessage(msg);
    e.target.value = '';
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        const msg = await chatApi.uploadFile(roomId, file);
        addMessage(msg);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch {
      alert('Microphone permission denied');
    }
  };

  return (
    <div style={styles.container}>
      {/* Reply banner */}
      {replyTo && (
        <div style={styles.replyBanner}>
          <div style={styles.replyBannerContent}>
            <span style={styles.replyBannerName}>{replyTo.sender.name}</span>
            <span style={styles.replyBannerText}>
              {replyTo.content ?? replyTo.type.toLowerCase()}
            </span>
          </div>
          <button style={styles.replyClose} onClick={() => setReplyTo(null)}>
            <X size={16} color="#8696a0" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div style={styles.emojiPicker}>
          {EMOJIS.map((e) => (
            <button key={e} style={styles.emojiBtn} onClick={() => insertEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div style={styles.bar}>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />

        <button style={styles.iconBtn} onClick={() => setShowEmoji((v) => !v)} title="Emoji">
          <Smile size={22} color={showEmoji ? '#00a884' : '#8696a0'} />
        </button>

        <button style={styles.iconBtn} onClick={() => fileRef.current?.click()} title="Attach file">
          <Paperclip size={22} color="#8696a0" />
        </button>

        <textarea
          style={styles.input}
          placeholder="Type a message"
          value={text}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />

        {text.trim() ? (
          <button style={styles.sendBtn} onClick={sendText}>
            <Send size={20} color="#fff" />
          </button>
        ) : (
          <button style={{ ...styles.iconBtn, ...(recording ? styles.recording : {}) }} onClick={toggleRecording} title="Voice note">
            <Mic size={22} color={recording ? '#ef4444' : '#8696a0'} />
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', background: '#202c33', borderTop: '1px solid #2a3942' },
  replyBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 1rem', borderBottom: '1px solid #2a3942', background: '#1f2c33' },
  replyBannerContent: { flex: 1, borderLeft: '3px solid #00a884', paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 1 },
  replyBannerName: { color: '#00a884', fontSize: '0.8rem', fontWeight: 600 },
  replyBannerText: { color: '#8696a0', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 },
  replyClose: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  emojiPicker: { display: 'flex', flexWrap: 'wrap', gap: 2, padding: '8px 12px', maxHeight: 160, overflowY: 'auto', borderBottom: '1px solid #2a3942' },
  emojiBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '2px 4px', borderRadius: 4, lineHeight: 1 },
  bar: { display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0.6rem 1rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, flexShrink: 0 },
  recording: { background: 'rgba(239,68,68,0.1)' },
  input: {
    flex: 1, background: '#2a3942', border: 'none', outline: 'none',
    color: '#e9edef', fontSize: '0.95rem', borderRadius: 10, padding: '0.6rem 0.8rem',
    resize: 'none', maxHeight: 120, fontFamily: 'inherit', lineHeight: 1.4,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
};
