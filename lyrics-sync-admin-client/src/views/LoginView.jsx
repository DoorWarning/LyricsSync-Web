// src/views/LoginView.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const LoginView = ({ onGoogleSuccess, onError, error }) => {
  return (
    <div className="login-view">
      <h1>LyricsSync</h1>
      <h2><span>문제 수정 및 제작 요청</span></h2>
      <p style={{ marginBottom: '30px', color: '#ccc' }}>구글 계정으로 로그인하세요.</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <GoogleLogin
          onSuccess={onGoogleSuccess}
          onError={onError}
        />
      </div>
      
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default LoginView;