import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion'; 
import { useSound } from '../context/SoundContext';
import VolumeControl from '../components/VolumeControl';

import robotSvg from '../LOGO/robot.svg';
import animatedResultSvg from '../LOGO/animated_result.svg';
import lyricsSyncSvg from '../LOGO/LyricsSyncM.svg';

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

const JoinLinkView = ({ nickname, setNickname, roomCode, onJoinRoom, onGoBack, onOpenDescription }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', type: 'error' });
  const { playSound } = useSound();
  
  const closeAlert = () => setAlertInfo({ ...alertInfo, isOpen: false });
  const nicknameControls = useAnimation();

  useEffect(() => {
    const handleResize = () => { setIsMobile(window.innerWidth < 768); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (nickname) nicknameControls.start({ scale: [1, 1.02, 1], transition: { duration: 0.2 } });
  }, [nickname, nicknameControls]);

  const handleNicknameChange = (e) => {
    playSound(typingAudio);
    setNickname(e.target.value);
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

  const containerStyle = { display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '1280px', margin: '0 auto' };
  const imageColumnStyle = { width: isMobile ? '80%' : '60%', display: 'flex', justifyContent: 'center', alignItems: 'center' };
  const formColumnStyle = { width: isMobile ? '100%' : '40%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '20px 10px 10px' : '0' };
  const formStyle = { display: 'flex', flexDirection: 'column', padding: '20px', gap: '15px', textAlign: 'center' };
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
              <p className="text-slate-400">사용할 닉네임을 입력하세요.</p>

              <form onSubmit={handleJoin} style={formStyle}>
                <label htmlFor="nickname-join" className="text-2xl font-semibold text-[#E2E8F0]">닉네임</label>
                <motion.input animate={nicknameControls} whileFocus={{ scale: 1.02 }} id="nickname-join" type="text" value={nickname} onChange={handleNicknameChange} placeholder="닉네임" className="bg-[#38BDF8] rounded-lg p-4 text-2xl text-slate-900 font-semibold placeholder-slate-800/50 text-center focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/50 w-full" />
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={!nickname.trim()} className="bg-[#F43F5E] hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed text-white text-3xl font-bold py-4 rounded-lg transition-colors w-full">참가하기</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => { playSound(buttonAudio); onGoBack(); }} className="bg-[#38BDF8] hover:bg-[#38BDF8]/80 text-slate-900 text-xl font-bold py-3 rounded-lg transition-colors w-full">취소</motion.button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinLinkView;