import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useSound } from '../context/SoundContext';
import VolumeControl from '../components/VolumeControl';

import robotSvg from '../LOGO/robot.svg';
import animatedResultSvg from '../LOGO/animated_result.svg';
import lyricsSyncSvg from '../LOGO/LyricsSyncM.svg';

// --- [오디오 설정] 로컬 UI용 ---
const buttonAudio = new Audio('/sounds/button.ogg'); 
const entryAudio = new Audio('/sounds/entry.ogg');   
const alertAudio = new Audio('/sounds/result.ogg'); 
const typingAudio = new Audio('/sounds/typing.ogg'); 

buttonAudio.volume = 0.2; buttonAudio.preload = 'auto'; 
entryAudio.volume = 0.5; entryAudio.preload = 'auto';
alertAudio.volume = 0.5; alertAudio.preload = 'auto';
typingAudio.volume = 0.3; typingAudio.preload = 'auto';

const CustomAlert = ({ isOpen, message, type = 'error', onClose }) => {
  const { playSound } = useSound();
  
  // 팝업 열릴 때 알림음
  useEffect(() => { if (isOpen) playSound(alertAudio); }, [isOpen, playSound]);

  const isSuccess = type === 'success';
  const borderColor = isSuccess ? 'border-emerald-500' : 'border-rose-500';
  const buttonColor = isSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600';
  const icon = isSuccess ? '✅' : '⚠️';
  const title = isSuccess ? '성공' : '알림';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { playSound(buttonAudio); onClose(); }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`relative w-full max-w-sm bg-slate-800 border-2 ${borderColor} rounded-2xl p-6 shadow-2xl text-center`}
          >
            <div className="mb-4 text-5xl">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-300 mb-6 word-keep-all whitespace-pre-wrap">{message}</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { playSound(buttonAudio); onClose(); }}
              className={`w-full py-3 ${buttonColor} text-white font-bold rounded-xl transition shadow-lg`}
            >
              확인
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const LoginView = ({ nickname, setNickname, roomCode, setRoomCode, onCreateRoom, onJoinRoom, onOpenDescription }) => {
  const [activeTab, setActiveTab] = useState('login'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', type: 'error' });
  const { playSound } = useSound();

  const closeAlert = () => setAlertInfo({ ...alertInfo, isOpen: false });
  const nicknameControls = useAnimation();
  const roomCodeControls = useAnimation();

  useEffect(() => {
    const handleResize = () => { setIsMobile(window.innerWidth < 768); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (nickname) nicknameControls.start({ scale: [1, 1.02, 1], transition: { duration: 0.2 } });
  }, [nickname, nicknameControls]);

  useEffect(() => {
    if (roomCode) roomCodeControls.start({ scale: [1, 1.02, 1], transition: { duration: 0.2 } });
  }, [roomCode, roomCodeControls]);

  const handleNicknameChange = (e) => {
    playSound(typingAudio);
    setNickname(e.target.value);
  };

  const handleRoomCodeChange = (e) => {
    playSound(typingAudio);
    setRoomCode(e.target.value.toUpperCase());
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await onJoinRoom();
      playSound(entryAudio);
    } catch (error) {
      setAlertInfo({ isOpen: true, message: error.message || error || "참가 중 오류가 발생했습니다.", type: 'error' });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await onCreateRoom();
      playSound(entryAudio);
    } catch (error) {
      setAlertInfo({ isOpen: true, message: error.message || error || "방 생성 중 오류가 발생했습니다.", type: 'error' });
    }
  };

  const handleTabChange = (tab) => {
    playSound(buttonAudio);
    setActiveTab(tab);
  };

  const containerStyle = { display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '1280px', margin: '0 auto' };
  const imageColumnStyle = { width: isMobile ? '80%' : '60%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '10px 0px' : '0' };
  const formColumnStyle = { width: isMobile ? '100%' : '40%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '0px 10px 10px' : '0' };
  const formStyle = { display: 'flex', flexDirection: 'column', padding: '0px 20px 20px 20px', gap: '15px', textAlign: 'center' };
  const formPanelStyle = { backgroundColor: '#312E81', borderRadius: '10px', width: '100%', maxWidth: '28rem', textAlign: 'center' };

  return (
    <div className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4 text-[#E2E8F0] relative">
      <div className="absolute top-4 right-4 z-50">
        <VolumeControl onOpenDescription={onOpenDescription} />
      </div>
      <CustomAlert isOpen={alertInfo.isOpen} message={alertInfo.message} type={alertInfo.type} onClose={closeAlert} />

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
            <div className="flex mb-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleTabChange('login')} className={`flex-1 py-3 !text-2xl font-bold rounded-lg transition-colors ${activeTab === 'login' ? 'bg-[#38BDF8] text-slate-900' : 'bg-transparent text-[#E2E8F0]/70'}`}>방 만들기</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleTabChange('code')} className={`flex-1 py-3 !text-2xl font-bold rounded-lg transition-colors ${activeTab === 'code' ? 'bg-[#38BDF8] text-slate-900' : 'bg-transparent text-[#E2E8F0]/70'}`}>방 입장</motion.button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleCreate} style={formStyle}>
                <label htmlFor="nickname-create" className="text-2xl font-semibold text-[#E2E8F0]">닉네임 입력</label>
                <motion.input animate={nicknameControls} id="nickname-create" type="text" value={nickname} onChange={handleNicknameChange} placeholder="닉네임" className="bg-[#38BDF8] rounded-lg p-4 text-2xl text-slate-900 font-semibold placeholder-slate-800/50 text-center focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/50 w-full" />
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={!nickname.trim()} className="bg-[#F43F5E] hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed text-white text-3xl font-bold py-4 rounded-lg transition-colors w-full">시작</motion.button>
              </form>
            ) : (
              <form onSubmit={handleJoin} style={formStyle}>
                <label htmlFor="nickname-join" className="text-2xl font-semibold text-[#E2E8F0]">닉네임 입력</label>
                <motion.input animate={nicknameControls} id="nickname-join" type="text" value={nickname} onChange={handleNicknameChange} placeholder="닉네임" className="bg-[#38BDF8] rounded-lg p-4 text-2xl text-slate-900 font-semibold placeholder-slate-800/50 text-center focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/50 w-full" />
                <label htmlFor="room-code" className="text-2xl font-semibold text-[#E2E8F0]">방 코드 입력</label>
                <motion.input animate={roomCodeControls} id="room-code" type="text" value={roomCode} onChange={handleRoomCodeChange} placeholder="CODE" maxLength={4} className="bg-[#38BDF8] rounded-lg p-4 text-3xl text-center tracking-[0.5em] font-bold text-slate-900 placeholder-slate-800/50 focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/50 w-full" />
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={!nickname.trim() || roomCode.length < 4} className="bg-[#F43F5E] hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed text-white text-3xl font-bold py-4 rounded-lg transition-colors w-full">참가</motion.button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;