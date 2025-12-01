// src/components/GameDescriptionModal.jsx
import React from 'react';
import { motion } from 'framer-motion'; // ⭐ [추가]

const GameDescriptionModal = ({ onClose }) => {
  return (
    <motion.div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm" 
      onClick={onClose}
      // ⭐ [추가] 배경 페이드인/아웃 효과
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="bg-[var(--panel-bg)] p-6 md:p-8 rounded-3xl border-2 border-[var(--accent-blue)] max-w-2xl w-[90%] text-left shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        // ⭐ [추가] 팝업창 팝업(Pop-up) 효과
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent-blue)] m-0">
            게임 가이드 📖
          </h2>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 text-white custom-scrollbar">
          <section>
            <h3 className="text-[var(--accent-pink)] text-xl font-bold mb-2">1. 게임 소개</h3>
            <p className="text-gray-300 leading-relaxed">
              AI 번역기가 망쳐놓은 <strong>엉뚱한 가사</strong>를 보고 원곡 제목을 맞히는 게임입니다.<br></br>
              <strong>"이게 도대체 무슨 노래야?"</strong> 싶을 때, 센스를 발휘해 보세요!
            </p>
          </section>

          <section>
            <h3 className="text-[var(--accent-pink)] text-xl font-bold mb-2">2. 점수 규칙</h3>
            <ul className="bg-[#151a28] p-4 rounded-xl space-y-2 text-sm md:text-base">
              <li className="flex justify-between">
                <span>🕒 <strong>0~30초</strong> (힌트 없음)</span>
                <span className="text-yellow-400 font-bold">30점</span>
              </li>
              <li className="flex justify-between">
                <span>🕒 <strong>30~45초</strong> (초성 힌트)</span>
                <span className="text-yellow-400 font-bold">20점</span>
              </li>
              <li className="flex justify-between">
                <span>🕒 <strong>45~60초</strong> (가수 힌트)</span>
                <span className="text-yellow-400 font-bold">10점</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-[var(--accent-pink)] text-xl font-bold mb-2">3. 꿀팁</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>채팅창에 정답을 입력하면 <strong>자동</strong>으로 인식됩니다.</li>
              <li><strong>자동완성</strong>기능을 적극 활용하세요!</li>
              <li>팀전에서는 우리 팀이 맞히면 팀 점수가 올라갑니다.</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 text-center">
          <button onClick={onClose} className="btn-primary px-10 py-3 text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameDescriptionModal;