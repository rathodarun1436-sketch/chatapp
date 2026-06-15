import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import { useChatStore } from '../../store/chatStore';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useChatStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login(form.email, form.password)
        : await authApi.register(form.name, form.email, form.password, form.mobile);
      setAuth(res.user, res.accessToken);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <MessageCircle size={36} color="#25d366" />
          <h1 style={styles.logoText}>ChatApp</h1>
        </div>

        <div style={styles.tabs}>
          {(['login', 'register'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={styles.form}>
          {mode === 'register' && (
            <input style={styles.input} placeholder="Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          )}
          <input style={styles.input} type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {mode === 'register' && (
            <input style={styles.input} placeholder="Mobile (optional)" value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          )}
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.submit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#111b21',
  },
  card: {
    background: '#202c33', borderRadius: 16, padding: '2.5rem 2rem', width: 360,
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: '1.75rem' },
  logoText: { color: '#e9edef', fontSize: '1.5rem', fontWeight: 700, margin: 0 },
  tabs: { display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: '1.5rem', background: '#2a3942' },
  tab: {
    flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
    background: 'transparent', color: '#8696a0', fontWeight: 600, fontSize: '0.9rem',
  },
  tabActive: { background: '#00a884', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: {
    padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #2a3942',
    background: '#2a3942', color: '#e9edef', fontSize: '0.95rem', outline: 'none',
  },
  error: { color: '#ef4444', fontSize: '0.85rem', margin: 0 },
  submit: {
    padding: '0.8rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: '#00a884', color: '#fff', fontWeight: 700, fontSize: '1rem', marginTop: 4,
  },
};
