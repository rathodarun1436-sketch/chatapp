import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useChatStore } from './store/chatStore';
import { wsService } from './services/websocket';
import { userApi } from './services/api';
import AuthPage from './components/Auth/AuthPage';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';
import ProfilePanel from './components/Profile/ProfilePanel';

function ChatLayout() {
  const { token, showProfile } = useChatStore();

  useEffect(() => {
    if (!token) return;
    wsService.connect(token);
    return () => wsService.disconnect();
  }, [token]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#111b21' }}>
      <Sidebar />
      <ChatWindow />
      {showProfile && <ProfilePanel />}
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useChatStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, currentUser, setAuth, clearAuth } = useChatStore();

  // On page refresh: token exists in localStorage but currentUser is lost.
  // Re-fetch the user profile so the app works without requiring a new login.
  useEffect(() => {
    if (token && !currentUser) {
      userApi.getMe()
        .then((user) => setAuth(user, token))
        .catch(() => clearAuth()); // token expired → force re-login
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
