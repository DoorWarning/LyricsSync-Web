// src/components/GlobalHeader.jsx
import React from 'react';

// '뒤로가기' 버튼이 있는 공통 헤더
const GlobalHeader = ({ onBack }) => (
  // ⭐ [수정] Tailwind 클래스 적용
  <header className="flex justify-between items-center mb-5">
    <button className="btn-secondary" onClick={onBack}>뒤로</button>
    <h2 className="m-0">LyricsSync</h2>
    <div className="w-16"></div> {/* 오른쪽 균형 맞추기용 빈 공간 */}
  </header>
);

export default GlobalHeader;