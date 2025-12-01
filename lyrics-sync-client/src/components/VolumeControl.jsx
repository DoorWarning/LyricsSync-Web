// src/components/VolumeControl.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../context/SoundContext';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL;

// SVG 아이콘 컴포넌트 (className으로 크기/색상 제어)
const SoundIcon = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(10.87633,-0.3919215)" stroke="currentColor" fill="none" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 75.368421,189.89474 H 186.10527 L 288.02461,87.975393 V 424.80845 L 183.72122,320.50505 H 75.368421 Z" />
    <path d="m 293.05222,325.14583 a 76.631577,76.631577 0 0 0 42.94727,-68.69726 76.631577,76.631577 0 0 0 -42.94727,-68.81055 z" />
    <path d="m 342.41012,383.13085 c 44.82929,-26.44482 72.37763,-74.58201 72.4688,-126.62993 -0.0142,-52.1258 -27.57283,-100.36362 -72.46916,-126.84792" />
  </g>
</svg>

);

const MuteIcon = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(10.87633,-0.3919215)" stroke="currentColor" fill="none" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 75.368421,189.89474 H 186.10527 L 288.02461,87.975393 V 424.80845 L 183.72122,320.50505 H 75.368421 Z" />
    <path d="M 83.160852,94.429103 407.08649,418.35474" strokeWidth="17" />
    <path d="m 293.05222,325.14583 a 76.631577,76.631577 0 0 0 42.94727,-68.69726 76.631577,76.631577 0 0 0 -42.94727,-68.81055 z" />
    <path d="m 342.41012,383.13085 c 44.82929,-26.44482 72.37763,-74.58201 72.4688,-126.62993 -0.0142,-52.1258 -27.57283,-100.36362 -72.46916,-126.84792" />
  </g>
</svg>

);

const VolumeControl = ({ onOpenDescription }) => {
  const { isMuted, toggleMute } = useSound();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const handleOpenAdmin = () => {
    if (ADMIN_URL) window.open(ADMIN_URL, '_blank');
    else alert('관리자 페이지 주소가 설정되지 않았습니다.');
    setIsOpen(false);
  };

  const handleOpenDesc = () => {
    onOpenDescription();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⭐ [수정] 인라인 스타일에서 고정 크기(40px) 제거
  // Tailwind 클래스로 반응형 크기를 제어해야 하므로 여기선 정렬만 담당합니다.
  const btnStyle = {
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // ⭐ [수정] 공통 클래스에 반응형 크기 적용
  // 모바일: w-10 h-10 (40px)
  // 데스크톱(md): w-[50px] h-[50px] (1.25배 확대)
  // min-w, min-h도 동일하게 적용하여 찌그러짐 방지
  const commonClass = 
    "bg-[#252D4A] border border-[#B0B8D9] text-[#4DFFFF] font-bold rounded-full hover:bg-[#3E5F8A] shadow-lg p-0 shrink-0 transition-colors flex items-center justify-center " +
    "w-10 h-10 min-w-[40px] min-h-[40px] " + 
    "md:w-[50px] md:h-[50px] md:min-w-[50px] md:min-h-[50px] " +
    "text-xl md:text-2xl"; // 텍스트 크기도 반응형

  // ⭐ 아이콘 크기 반응형 클래스
  const iconClass = "w-6 h-6 md:w-8 md:h-8";

  const buttons = (
    <>
      {/* 1. 게임 설명 (?) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenDesc}
        className={commonClass}
        title="게임 설명 보기"
        style={btnStyle}
      >
        ?
      </motion.button>

      {/* 2. 관리자 (Q) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenAdmin}
        className={commonClass}
        title="관리자 페이지 열기"
        style={btnStyle}
      >
        Q
      </motion.button>

      {/* 3. 음소거 */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        className={commonClass}
        title={isMuted ? "음소거 해제" : "음소거"}
        style={btnStyle}
      >
        {isMuted ? (
          <MuteIcon className={iconClass} />
        ) : (
          <SoundIcon className={iconClass} />
        )}
      </motion.button>
    </>
  );

  return (
    <div className="relative z-50 flex items-center" ref={menuRef}>
      
      {/* [데스크톱] 가로 배열 */}
      <div className="hidden md:flex items-center gap-3 md:gap-4">
        {buttons}
      </div>

      {/* [모바일] '...' 토글 버튼 */}
      <div className="md:hidden flex items-center">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          // 모바일 토글 버튼은 40px 유지
          className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center bg-[#252D4A] border border-[#B0B8D9] text-[#4DFFFF] rounded-full shadow-lg shrink-0 p-0"
          style={btnStyle}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </motion.button>

        {/* 드롭다운 메뉴 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 bg-[#1A2036] border border-[#4A5575] p-3 rounded-2xl shadow-2xl flex flex-col gap-3 items-center min-w-[60px]"
              style={{ zIndex: 100 }}
            >
              {buttons}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default VolumeControl;