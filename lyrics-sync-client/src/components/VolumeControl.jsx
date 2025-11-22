// src/components/VolumeControl.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../context/SoundContext';

// 1. 파일 경로를 정확하게 import 합니다.
// (경로가 '../LOGO/sound.svg'가 맞는지 꼭 파일 탐색기에서 확인해주세요)
import soundSvg from '../LOGO/sound.svg';
import muteSvg from '../LOGO/mute.svg';

const VolumeControl = () => {
  const { isMuted, toggleMute } = useSound();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleMute}
      className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-indigo-800/50 hover:bg-indigo-700/50 rounded-full backdrop-blur-sm border border-indigo-500/30 text-white transition-colors shadow-lg"
      title={isMuted ? "음소거 해제" : "음소거"}
    >
      {/* 2. svg 태그 대신 img 태그를 사용합니다. */}
      <img 
        src={isMuted ? muteSvg : soundSvg} 
        alt={isMuted ? "Muted" : "Sound On"} 
        style={{ width: '24px', height: '24px', minWidth: '24px' }}
        className="brightness-0 invert"
      />
    </motion.button>
  );
};

export default VolumeControl;