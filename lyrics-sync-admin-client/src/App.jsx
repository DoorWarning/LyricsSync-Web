import React, { useState, useEffect } from 'react';
import api from './lib/api'; // ⭐ 우리가 만든 api import
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('adminUser');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      // api.post 사용 (헤더/URL 자동 처리)
      const res = await api.post('/api/admin/google-login', {
        token: credentialResponse.credential
      });

      if (res.data.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));
      }
    } catch (err) {
      console.error('Login Failed:', err);
      alert('로그인 실패: 서버 연결을 확인하세요.');
    }
  };

  const handleLoginFailure = () => {
    alert('구글 로그인에 실패했습니다.');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  return (
    <div className="text-white min-h-screen bg-gray-900">
      {!token ? (
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onLoginFailure={handleLoginFailure} 
        />
      ) : (
        <DashboardView 
          user={user} 
          token={token} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;