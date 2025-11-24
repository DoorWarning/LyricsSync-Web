// src/App.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

// 뷰 컴포넌트 임포트
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';

// 서버 API 주소 (.env에서 로드)
const API_URL = `${import.meta.env.VITE_SERVER_URL}/api/admin`;

function App() {
  // ----------------------------------------------------------------
  // 상태 관리 (State Management)
  // ----------------------------------------------------------------
  const [user, setUser] = useState(null); // { email, name, role }
  const [token, setToken] = useState(null); // JWT 토큰
  const [songs, setSongs] = useState([]);
  const [editingSong, setEditingSong] = useState(null); 
  const [activeTab, setActiveTab] = useState('songs'); // 'songs' | 'requests'
  const [error, setError] = useState('');

  // SongForm의 입력 데이터 (QuizMaker와 연동하기 위해 상위에서 관리)
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    original_lyrics: '',
    translated_lyrics: '',
    hint: '',
    collectionNames: 'kpop-classics',
  });

  // ----------------------------------------------------------------
  // 효과 및 핸들러 (Effects & Handlers)
  // ----------------------------------------------------------------

  // 초기 로드 시 로컬 스토리지에서 로그인 정보 복원
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 로그인 성공 시 노래 목록 로딩
  useEffect(() => {
    if (user && token) fetchSongs();
  }, [user, token]);

  // 노래 목록 가져오기 API
  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${API_URL}/songs`, {
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.data.success) setSongs(response.data.songs);
    } catch (err) {
      console.error("Load failed", err);
      // 토큰 만료 시 로그아웃 처리
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  // 구글 로그인 성공 핸들러
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_URL}/google-login`, {
        token: credentialResponse.credential
      });
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        // 상태 업데이트
        setUser(newUser); 
        setToken(newToken); 
        
        // 로컬 스토리지 저장 (새로고침 시 유지)
        localStorage.setItem('adminToken', newToken);
        localStorage.setItem('adminUser', JSON.stringify(newUser));
        
        setError('');
      }
    } catch (err) {
      setError(`로그인 실패: ${err.response?.data?.message || "오류가 발생했습니다."}`);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setSongs([]);
    setEditingSong(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  // ----------------------------------------------------------------
  // 뷰 렌더링 (View Rendering)
  // ----------------------------------------------------------------

  // 1. 로그인 전: 로그인 화면 표시
  if (!user) {
    return (
      <LoginView 
        onGoogleSuccess={handleGoogleSuccess} 
        onError={() => setError('Google Login Failed')} 
        error={error}
      />
    );
  }

  // 2. 로그인 후: 대시보드 화면 표시
  return (
    <div className="App">
      <DashboardView 
        user={user}
        token={token}
        apiUrl={API_URL}
        
        // 노래 데이터 및 함수
        songs={songs}
        fetchSongs={fetchSongs}
        
        // 수정 상태 및 함수
        editingSong={editingSong}
        setEditingSong={setEditingSong}
        
        // 폼 데이터 및 함수
        formData={formData}
        setFormData={setFormData}
        
        // 탭 및 로그아웃
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;