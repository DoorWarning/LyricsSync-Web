// src/components/GlobalHeader.jsx
import React from 'react';

const GlobalHeader = ({ onBack, onOpenDescription }) => (
  <header className="flex justify-between items-center mb-5">
    <button className="btn-secondary" onClick={onBack}>뒤로</button>
    <h2 className="m-0">LyricsSync</h2>
    <div className="w-16"></div> {/* 오른쪽 균형 맞추기용 빈 공간 */}
    <VolumeControl onOpenDescription={onOpenDescription} />
  </header>
);

export default GlobalHeader;