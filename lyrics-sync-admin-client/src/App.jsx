// src/App.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

// 뷰 컴포넌트 임포트
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';

// ⭐ [NEW] 커스텀 팝업 컴포넌트 임포트
import AlertModal from './components/AlertModal'; 

// 서버 API 주소
const API_URL = `${import.meta.env.VITE_SERVER_URL}/api/admin`;

function App() {
  // ----------------------------------------------------------------
  // 상태 관리
  // ----------------------------------------------------------------
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(null); 
  const [songs, setSongs] = useState([]);
  const [editingSong, setEditingSong] = useState(null); 
  const [activeTab, setActiveTab] = useState('songs');
  const [error, setError] = useState('');

  // 커스텀 팝업 상태
  const [customAlert, setCustomAlert] = useState(null);

  // SongForm 데이터
  const [formData, setFormData] = useState({
    title: '', artist: '', original_lyrics: '', translated_lyrics: '', 
    hint: '', collectionNames: '',
  });

  // ----------------------------------------------------------------
  // 팝업 핸들러
  // ----------------------------------------------------------------
  const handleShowAlert = (message, type = 'success') => {
    setCustomAlert({ message, type });
  };
  
  const handleShowConfirm = (message, confirmAction) => {
    setCustomAlert({ message, type: 'confirm', confirmAction });
  };

  // ----------------------------------------------------------------
  // 초기화 및 로그인 로직
  // ----------------------------------------------------------------

  // 1. 앱 시작 시 로컬 스토리지 확인
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("JSON Parse Error", e);
        handleLogout();
      }
    }
  }, []);

  // 2. 로그인 성공 시 노래 목록 로딩
  useEffect(() => {
    if (user && token) fetchSongs();
  }, [user, token]);

  // 3. 노래 목록 가져오기
  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${API_URL}/songs`, {
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.data.success) setSongs(response.data.songs);
    } catch (err) {
      console.error("Load failed", err);
      if (err.response && err.response.status === 401) {
        handleLogout(); // 토큰 만료 시 튕겨내기
      }
    }
  };

  // 4. 구글 로그인 핸들러
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_URL}/google-login`, {
        token: credentialResponse.credential
      });
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        setUser(newUser); 
        setToken(newToken); 
        
        localStorage.setItem('adminToken', newToken);
        localStorage.setItem('adminUser', JSON.stringify(newUser));
        
        setError('');
      }
    } catch (err) {
      setError(`로그인 실패: ${err.response?.data?.message || "오류가 발생했습니다."}`);
    }
  };

  // 5. 로그아웃 핸들러
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setSongs([]);
    setEditingSong(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  // ----------------------------------------------------------------
  // 뷰 렌더링 (여기가 핵심입니다!)
  // ----------------------------------------------------------------

  // ⭐ [핵심] user가 없으면 LoginView만 리턴하고 여기서 끝냅니다.
  // 아래의 DashboardView는 실행조차 되지 않습니다.
  if (!user) {
    return (
      <div className="App">
        <LoginView 
          onGoogleSuccess={handleGoogleSuccess} 
          onError={() => setError('Google Login Failed')} 
          error={error}
        />
      </div>
    );
  }

  // ⭐ user가 있을 때만 여기가 실행됩니다.
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
        onLogout={handleLogout}
        
        // 팝업 핸들러 전달
        showAlert={handleShowAlert}
        showConfirm={handleShowConfirm}
      />

      {/* 커스텀 팝업 렌더링 */}
      <AlertModal customAlert={customAlert} setCustomAlert={setCustomAlert} />
    </div>
  );
}

export default App;