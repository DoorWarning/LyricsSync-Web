// src/views/LoginView.jsx
import React, { useState, useEffect } from 'react';

// SVG 파일 임포트
import robotSvg from '../LOGO/robot.svg';
import animatedResultSvg from '../LOGO/animated_result.svg';
import lyricsSyncSvg from '../LOGO/LyricsSyncM.svg';

const LoginView = ({ nickname, setNickname, roomCode, setRoomCode, onCreateRoom, onJoinRoom }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' 또는 'code'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    onJoinRoom();
  };

  const handleCreate = (e) => {
    e.preventDefault();
    onCreateRoom();
  };

  // --- 인라인 스타일 정의 ---
  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
  };

  const imageColumnStyle = {
    width: isMobile ? '80%' : '60%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const formColumnStyle = {
    width: isMobile ? '100%' : '40%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '0px 10px 10px' : '0',
  };
  
  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    gap: '15px',
    textAlign: 'center',
  };

  const formPanelStyle = {
    backgroundColor: '#312E81',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '28rem',
    textAlign: 'center',
  };

  return (
    <div className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4 text-[#E2E8F0]">
      <div style={containerStyle}>
        
        <div style={imageColumnStyle}>
          {isMobile ? (
            <div style={{ maxWidth: '80%', margin: '0 auto' }}>
              <img src={robotSvg} alt="Lyrics Quiz Robot" className="w-full h-auto" />
              <img src={lyricsSyncSvg} alt="Lyrics Sync Logo" className="w-full h-auto mt-4" />
            </div>
          ) : (
            <div className="max-w-2xl">
              <img src={animatedResultSvg} alt="Lyrics Quiz" className="w-full h-auto" />
            </div>
          )}
        </div>

        <div style={formColumnStyle}>
          <div style={formPanelStyle}>
            
            <div className="flex mb-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 text-2xl font-bold rounded-lg transition-colors ${
                  activeTab === 'login' ? 'bg-[#38BDF8] text-slate-900' : 'bg-transparent text-[#E2E8F0]/70'
                }`}
              >
                방 만들기
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-3 text-2xl font-bold rounded-lg transition-colors ${
                  activeTab === 'code' ? 'bg-[#38BDF8] text-slate-900' : 'bg-transparent text-[#E2E8F0]/70'
                }`}
              >
                코드로 참여
              </button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleCreate} style={formStyle}>
                <label htmlFor="nickname-create" className="text-2xl font-semibold text-[#E2E8F0]">닉네임 입력</label>
                <input
                  id="nickname-create"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임"
                  className="bg-[#38BDF8] rounded-lg p-4 text-2xl text-slate-900 font-semibold placeholder-slate-800/50 text-center focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/50 w-full"
                />
                <button 
                  type="submit"
                  disabled={!nickname.trim()}
                  className="bg-[#F43F5E] hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed text-white text-3xl font-bold py-4 rounded-lg transition-colors w-full"
                >
                  시작
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} style={formStyle}>
                <label htmlFor="nickname-join" className="text-2xl font-semibold text-[#E2E8F0]">닉네임 입력</label>
                <input
                  id="nickname-join"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임"
                  className="bg-[#38BDF8] rounded-lg p-4 text-2xl text-slate-900 font-semibold placeholder-slate-800/50 text-center focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/50 w-full"
                />
                <label htmlFor="room-code" className="text-2xl font-semibold text-[#E2E8F0]">방 코드 입력</label>
                <input
                  id="room-code"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={4}
                  className="bg-[#38BDF8] rounded-lg p-4 text-3xl text-center tracking-[0.5em] font-bold text-slate-900 placeholder-slate-800/50 focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/50 w-full"
                />
                <button 
                  type="submit"
                  disabled={!nickname.trim() || roomCode.length < 4}
                  className="bg-[#F43F5E] hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed text-white text-3xl font-bold py-4 rounded-lg transition-colors w-full"
                >
                  참가
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
