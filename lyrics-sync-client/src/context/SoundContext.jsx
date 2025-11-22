// src/context/SoundContext.jsx
import React, { createContext, useContext, useState } from 'react';

const SoundContext = createContext();

export const useSound = () => useContext(SoundContext);

export const SoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // 전역 재생 함수: 음소거 상태를 체크하고 재생
  const playSound = (audio) => {
    if (!audio || isMuted) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio blocked:", e));
    } catch (error) {
      console.error("Audio play error:", error);
    }
  };

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};