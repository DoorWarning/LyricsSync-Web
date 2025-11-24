// src/views/LoginView.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const LoginView = ({ onGoogleSuccess, onError, error }) => {
  return (
    <div className="login-view">
      <h1>LyricsSync <span>Admin</span></h1>
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