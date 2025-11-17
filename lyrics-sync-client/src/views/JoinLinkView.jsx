// src/views/JoinLinkView.jsx
import React, { useState, useEffect } from 'react';

// SVG 파일 임포트
import robotSvg from '../LOGO/robot.svg';
import animatedResultSvg from '../LOGO/animated_result.svg';
import lyricsSyncSvg from '../LOGO/LyricsSyncM.svg';

const JoinLinkView = ({ nickname, setNickname, roomCode, onJoinRoom, onGoBack }) => {
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

  // --- 인라인 스타일 정의 (LoginView와 동일) ---
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
    padding: isMobile ? '20px 10px 10px' : '0',
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
    // padding: '2rem', // p-8 (32px)
    width: '100%',
    maxWidth: '28rem', // max-w-md
    textAlign: 'center',
  };

  return (
    <div className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4 text-[#E2E8F0]">
      <div style={containerStyle}>
        
        <div style={imageColumnStyle}>
          {isMobile ? (
            <div style={{ maxWidth: '80%', margin: '0 auto' }}>
              <img src={robotSvg} alt="Lyrics Quiz Robot" className="w-full h-auto" />
              <img src={lyricsSyncSvg} alt="Lyrics Sync Logo" className="w-full h-auto mt-4" style={{transform: 'scale(1.5)'}}/>
            </div>
          ) : (
            <div className="max-w-2xl">
              <img src={animatedResultSvg} alt="Lyrics Quiz" className="w-full h-auto" />
            </div>
          )}
        </div>

        <div style={formColumnStyle}>
          <div style={formPanelStyle}>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-sky-300 mb-2">
                <span className="text-4xl" style={{ color: '#F43F5E' }}>{roomCode}</span> 방에 참여
              </h2>
              <p className="text-slate-400 mb-8">사용할 닉네임을 입력하세요.</p>

              <form onSubmit={handleJoin} style={formStyle}>
                <label htmlFor="nickname-join" className="text-2xl font-semibold text-[#E2E8F0]">닉네임</label>
                <input
                  id="nickname-join"
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
                  참가하기
                </button>
                <button 
                  type="button"
                  onClick={onGoBack}
                  className="bg-[#38BDF8] hover:bg-[#38BDF8]/80 text-slate-900 text-xl font-bold py-3 rounded-lg transition-colors w-full"
                >
                  취소
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinLinkView;