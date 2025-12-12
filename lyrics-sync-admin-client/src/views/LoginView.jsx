import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const LoginView = ({ onLoginSuccess, onLoginFailure }) => {
  return (
    <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="bg-panel p-10 rounded-2xl shadow-2xl border border-gray-700/50 max-w-md w-full relative overflow-hidden">
        
        {/* 상단 컬러 라인 장식 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-brand-pink"></div>

        <div className="mb-8 flex justify-center">
          {/* ⭐ [수정] 음표 이모지 -> vite.svg 이미지로 교체 */}
          <img 
            src="/vite.svg" 
            alt="LyricsSync Logo" 
            className="w-24 h-24 hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(77,255,255,0.3)]"
          />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          LyricsSync <span className="text-brand-blue">Admin</span>
        </h1>
        <p className="text-text-sub mb-8 text-sm">관리자 및 뷰어 계정으로 로그인하세요</p>
        
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={onLoginSuccess}
            onError={onLoginFailure}
            theme="filled_black"
            shape="pill"
            size="large"
          />
        </div>
      </div>
      <p className="mt-8 text-gray-500 text-xs">© 2025 LyricsSync Project</p>
    </div>
  );
};

export default LoginView;