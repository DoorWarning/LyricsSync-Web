// src/views/GameView.jsx
import React from 'react';
import GlobalHeader from '../components/GlobalHeader';

const GameView = ({
  roomState,
  quizLyrics,
  messages,
  teamScores,
  sortedScoreboard,
  suggestions,
  currentMessage,
  onMessageChange,
  onSubmitAnswer,
  onGoBack
}) => {
  
  if (!roomState) return <div>게임을 불러오는 중...</div>;

  const { settings } = roomState;

  return (
    <div className="w-full">
      <GlobalHeader onBack={onGoBack} />
      
      <div className="flex flex-col md:flex-row gap-5 mt-8">
        
        {/* 점수판 (왼쪽) */}
        <div className="panel flex-1">
          <h3 className="text-lg font-bold border-b border-[var(--panel-bg)] pb-2 mb-4 text-left">
            점수판
          </h3>
          {settings.isTeamMode ? (
            <ul className="list-none p-0">
              <li data-team="A" className="text-lg font-bold p-4 rounded-lg bg-opacity-20 bg-[var(--team-a)] text-[var(--team-a)] mb-2">
                A팀: {teamScores.A}점
              </li>
              <li data-team="B" className="text-lg font-bold p-4 rounded-lg bg-opacity-20 bg-[var(--team-b)] text-[var(--team-b)]">
                B팀: {teamScores.B}점
              </li>
            </ul>
          ) : (
            <ul className="list-none p-0 flex flex-col gap-2">
              {sortedScoreboard.map(([id, player]) => (
                <li key={id} className="text-lg font-bold p-4 rounded-lg bg-[var(--accent-blue-dark)] flex items-center justify-between">
                  <span>{player.nickname}</span>
                  <span>{player.score}점</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* 문제/채팅/입력 (오른쪽) */}
        <div className="flex-[2] flex flex-col gap-5">
          <div className="panel flex-1">
            <h3 className="text-lg font-bold border-b border-[var(--panel-bg)] pb-2 mb-4 text-left">
              문제
            </h3>
            <div className="min-h-[150px] whitespace-pre-wrap text-2xl font-bold text-[var(--accent-blue)] text-left">
              {quizLyrics || "다음 라운드를 기다리는 중..."}
            </div>
          </div>
          
          <div className="panel h-64 overflow-y-scroll">
            <h3 className="text-lg font-bold border-b border-[var(--panel-bg)] pb-2 mb-4 text-left">
              채팅 로그
            </h3>
            <div className="flex flex-col gap-1">
              {messages.map((msg, index) => (
                <div key={index} className={`message type-${msg.type} text-left p-1 rounded ${
                  msg.type === 'hint' ? 'text-yellow-300 font-bold' :
                  msg.type === 'answer' ? 'text-green-400 font-bold' :
                  msg.type === 'answer_info' ? 'text-[var(--secondary-text)] italic' :
                  msg.type === 'system' ? 'text-[var(--accent-pink)] font-bold' :
                  'text-white'
                }`}>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          {/* 정답 입력창 */}
          <div className="relative flex gap-2">
            {suggestions.length > 0 && (
              <ul className="absolute bottom-full left-0 right-0 bg-[#2F3B5D] border border-[var(--accent-blue)] rounded-t-lg list-none p-0 m-0 z-10">
                {suggestions.map((title) => (
                  <li key={title} onMouseDown={() => onSubmitAnswer(title)} className="p-2 cursor-pointer hover:bg-[var(--accent-blue)] hover:text-black text-left">
                    {title}
                  </li>
                ))}
              </ul>
            )}
            <input
              type="text"
              placeholder={quizLyrics ? "채팅 및 정답 입력창" : "대기 중..."}
              value={currentMessage}
              onChange={onMessageChange}
              onKeyPress={(e) => e.key === 'Enter' && onSubmitAnswer(null)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              onFocus={onMessageChange}
              disabled={!quizLyrics}
              className="flex-grow !m-0"
            />
            <button onClick={() => onSubmitAnswer(null)} disabled={!quizLyrics} className="btn-primary">
              입력
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GameView;