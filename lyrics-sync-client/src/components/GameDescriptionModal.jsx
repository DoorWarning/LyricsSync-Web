// src/components/GameDescriptionModal.jsx
import React from 'react';

const GameDescriptionModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[var(--panel-bg)] p-8 rounded-3xl border-2 border-[var(--accent-blue)] max-w-2xl w-[90%] text-left shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
          <h2 className="text-3xl font-bold text-[var(--accent-blue)] m-0">
            게임 가이드 📖
          </h2>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 text-white">
          <section>
            <h3 className="text-[var(--accent-pink)] text-xl font-bold mb-2">1. 게임 소개</h3>
            <p className="text-gray-300 leading-relaxed">
              AI 번역기가 망쳐놓은 <strong>엉뚱한 가사</strong>를 보고 원곡 제목을 맞히는 게임입니다.<br/>
              "이게 도대체 무슨 노래야?" 싶을 때, 센스를 발휘해 보세요!
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
              <li>채팅창에 정답을 입력하면 자동으로 인식됩니다.</li>
              <li><strong>자동완성</strong> 기능을 적극 활용하세요!</li>
              <li>팀전에서는 우리 팀이 맞히면 팀 점수가 올라갑니다.</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 text-center">
          <button onClick={onClose} className="btn-primary px-10 py-3 text-lg">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameDescriptionModal;