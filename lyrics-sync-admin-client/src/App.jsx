// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

// 뷰 임포트
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';

const API_URL = `${import.meta.env.VITE_SERVER_URL}/api/admin`;

function App() {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(null);
  const [songs, setSongs] = useState([]);
  const [editingSong, setEditingSong] = useState(null); 
  const [activeTab, setActiveTab] = useState('songs'); 
  const [error, setError] = useState('');

  // SongForm 상태를 상위에서 관리 (QuizMaker와 연동 위해)
  const [formData, setFormData] = useState({
    title: '', artist: '', original_lyrics: '', translated_lyrics: '', hint: '', collectionNames: '',
  });

  // 로그인 성공 시 노래 목록 로딩
  useEffect(() => {
    if (user && token) fetchSongs();
  }, [user, token]);

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${API_URL}/songs`, {
        headers: { 'Authorization': token, 'x-user-email': user.email } 
      });
      if (response.data.success) setSongs(response.data.songs);
    } catch (err) {
      console.error("Load failed", err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_URL}/google-login`, {
        token: credentialResponse.credential
      });
      if (response.data.success) {
        setUser(response.data.user); 
        setToken(response.data.token || 'temp-token'); 
      }
    } catch (err) {
      setError(`로그인 실패: ${err.response?.data?.message || "오류"}`);
    }
  };

  // 뷰 렌더링
  if (!user) {
    return (
      <LoginView 
        onGoogleSuccess={handleGoogleSuccess} 
        onError={() => setError('Google Login Failed')} 
        error={error}
      />
    );
  }

  return (
    <div className="App">
      <DashboardView 
        user={user}
        token={token}
        apiUrl={API_URL}
        songs={songs}
        fetchSongs={fetchSongs}
        editingSong={editingSong}
        setEditingSong={setEditingSong}
        formData={formData}
        setFormData={setFormData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => { setUser(null); setToken(null); }}
      />
    </div>
  );
}

export default App;