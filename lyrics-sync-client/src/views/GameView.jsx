// src/views/GameView.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import robotSvg from '../LOGO/robot.svg';

// 아바타 이미지를 동적으로 가져오기 위한 함수
const getAvatar = (avatarId) => {
  try {
    return new URL(`../AVATARS/${avatarId}.png`, import.meta.url).href;
  } catch (e) {
    console.error(`Avatar ${avatarId} not found`, e);
    return new URL(`../AVATARS/av_1.png`, import.meta.url).href;
  }
};

// --- Variants ---
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9 }
};

// --- 정답 알림 팝업 컴포넌트 ---
const AnswerPopup = ({ data }) => {
  if (!data) return null;

  const isSuccess = data.type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-900/90 border-emerald-500' : 'bg-rose-900/90 border-rose-500';
  const titleColor = isSuccess ? 'text-emerald-300' : 'text-rose-300';
  const icon = isSuccess ? '🎉 정답! 🎉' : '⏰ 시간 종료';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative w-full max-w-lg ${bgColor} border-4 rounded-3xl p-8 shadow-2xl text-center pointer-events-auto`}
      >
        <h2 className={`text-4xl font-black ${titleColor} mb-6 drop-shadow-lg`}>{icon}</h2>
        
        {isSuccess && (
          <div className="mb-6 bg-black/30 rounded-xl p-4">
             <p className="text-2xl text-white font-bold">
               {data.team ? `[${data.team}팀] ` : ''}{data.user}
             </p>
             <p className="text-emerald-400 font-bold text-lg mt-1">+{data.scoreGained}점 획득!</p>
          </div>
        )}

        <div className="space-y-4 text-left bg-black/20 p-4 rounded-xl">
          <div>
            <p className="text-sm text-slate-400 font-bold">곡 정보</p>
            <p className="text-2xl text-white font-bold truncate">{data.artist} - {data.answer}</p>
          </div>
          <div className="border-t border-white/10 pt-2">
            <p className="text-sm text-slate-400 font-bold">원곡 가사</p>
            <p className="text-lg text-slate-200 font-medium leading-snug">{data.originalLyrics}</p>
          </div>
          <div className="border-t border-white/10 pt-2">
            <p className="text-sm text-slate-400 font-bold">번역 가사 (문제)</p>
            <p className="text-lg text-sky-200 font-medium leading-snug">{data.translatedLyrics}</p>
          </div>
        </div>

        <div className="mt-6 text-slate-400 text-sm animate-pulse">
          잠시 후 다음 라운드가 시작됩니다...
        </div>
      </motion.div>
    </div>
  );
};

// --- [수정됨] 팀원 미니 카드 컴포넌트 ---
const TeamMemberCard = ({ player }) => (
    // mb-1 last:mb-0 제거 (Grid gap으로 대체)
    <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 min-w-0">
      <img 
        src={getAvatar(player.avatar || 'av_1')} 
        alt={player.nickname} 
        className="w-8 h-8 rounded-full border border-white/30 bg-slate-800 flex-shrink-0"
      />
      <span className="text-sm font-bold text-white truncate">{player.nickname}</span>
    </div>
  );

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
  onGoBack,
  answerPopupData, 
  currentHints      
}) => {
  
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!roomState) return <div className="text-white">게임을 불러오는 중...</div>;

  const { settings, roomCode } = roomState;

  // --- 가사 및 메타데이터 파싱 로직 ---
  let collectionName = null;
  let roundInfo = null;
  let contentLyrics = quizLyrics;

  if (quizLyrics) {
    const splitIndex = quizLyrics.indexOf('\n');
    if (splitIndex !== -1) {
      const firstLine = quizLyrics.substring(0, splitIndex).trim();
      const match = firstLine.match(/^\[(.*?)\]\s*\((.*?)\)$/);

      if (match) {
        collectionName = match[1]; 
        roundInfo = match[2];      
        contentLyrics = quizLyrics.substring(splitIndex + 1);
      } else {
        contentLyrics = quizLyrics; 
      }
    }
  }

  // 메시지 박스 스타일
  const getMessageContainerStyle = (type) => {
    switch (type) {
      case 'hint': return 'bg-yellow-900/30 border-l-4 border-yellow-500';
      case 'answer': return 'bg-emerald-900/30 border-l-4 border-emerald-500';
      case 'answer_info': return 'bg-slate-800/50 pl-8 italic text-slate-300';
      case 'system': return 'bg-rose-900/20 text-center font-bold text-rose-400';
      case 'chat': default: return 'bg-slate-700/30 text-white';
    }
  };

  // 메시지 내용 파싱 및 렌더링 함수 (팀 색상 적용)
  const renderMessageContent = (msg) => {
    const teamMatch = msg.text.match(/^\[([AB])팀\]\s*(.*?):\s*(.*)$/);
    const individualMatch = msg.text.match(/^\[(.*?)\]:\s*(.*)$/);

    if (teamMatch && (msg.type === 'chat' || msg.type === 'answer')) {
        const team = teamMatch[1];     
        const nickname = teamMatch[2]; 
        const content = teamMatch[3];  
        const teamColor = team === 'A' ? 'text-red-400' : 'text-blue-400';

        return (
            <>
                <span className={`font-bold ${teamColor} mr-1`}>{nickname}</span>
                <span className={msg.type === 'answer' ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                    : {content}
                </span>
            </>
        );
    } 
    else if (individualMatch && (msg.type === 'chat' || msg.type === 'answer')) {
        const nickname = individualMatch[1];
        const content = individualMatch[2];
        
        return (
            <>
                <span className="font-bold text-white mr-1">{nickname}</span>
                <span className={msg.type === 'answer' ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                     : {content}
                </span>
            </>
        );
    }
    return msg.text;
  };

  return (
    <div className="bg-slate-900 h-screen text-white p-4 md:p-8 relative flex flex-col overflow-hidden">
      
      {/* 정답 팝업 */}
      <AnimatePresence>
        {answerPopupData && <AnswerPopup data={answerPopupData} />}
      </AnimatePresence>

      {/* --- 헤더 --- */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onGoBack} 
          className="bg-indigo-900 text-slate-200 font-bold py-2 px-4 text-lg rounded-2xl hover:bg-indigo-800 transition md:py-3 md:px-8 md:!text-2xl"
        >
          나가기
        </motion.button>
        <div className="flex flex-col items-center">
            <img src={robotSvg} alt="Robot Logo" className="w-12 h-12 mb-2" />
            <h2 className="text-lg text-slate-400">게임 진행 중</h2>
            <p className="text-2xl font-bold text-rose-500 tracking-widest">{roomCode}</p>
        </div>
        <div className="w-24"></div>
      </div>

      {/* --- 메인 컨텐츠 --- */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* --- 왼쪽 패널 (2/3) --- */}
        <div className="w-full md:w-2/3 bg-indigo-900 p-4 md:p-6 rounded-2xl flex flex-col gap-4 h-full min-h-0">
          
          {/* 문제 영역 */}
          <div className="flex flex-col flex-shrink-0">
            <div className="flex justify-between items-end px-2 mb-2 w-full">
               {collectionName ? (
                 <>
                   <div className="text-lg md:text-xl font-bold text-white truncate pr-4">
                     <span className="text-rose-400 mr-2">Now Playing :</span>
                     {collectionName}
                   </div>
                   <div className="text-base md:text-lg font-bold text-slate-400 whitespace-nowrap">
                     {roundInfo}
                   </div>
                 </>
               ) : (
                 <div className="text-slate-500 text-sm font-bold w-full text-center">게임 대기 중...</div>
               )}
            </div>

            <div className="bg-black bg-opacity-30 p-6 rounded-xl min-h-[200px] flex items-center justify-center border border-indigo-700 shadow-inner">
              <div className="whitespace-pre-wrap text-2xl md:text-3xl font-bold text-sky-300 leading-relaxed text-center break-keep">
                {contentLyrics || (
                  <span className="text-slate-500 animate-pulse">다음 라운드를 준비하고 있습니다...</span>
                )}
              </div>
            </div>
          </div>

          {/* 힌트 표시 영역 */}
          <AnimatePresence>
            {currentHints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '0.5rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex-shrink-0 bg-yellow-500/20 border-l-4 border-yellow-500 p-2 rounded-r-lg text-left overflow-hidden"
              >
                <div className="text-yellow-300 font-bold text-base flex items-center gap-3 overflow-x-auto scrollbar-hide">
                  <span className="text-lg flex-shrink-0">💡</span>
                  {currentHints.map((hint, index) => (
                    <React.Fragment key={index}>
                        <span className="whitespace-nowrap">{hint}</span>
                        {index < currentHints.length - 1 && (
                            <span className="text-yellow-500/50 mx-1">|</span>
                        )}
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 채팅 로그 영역 */}
          <div 
            ref={chatScrollRef}
            className="bg-black bg-opacity-20 p-4 rounded-xl flex-grow overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent min-h-0"
          >
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`p-2 rounded-lg text-left text-sm md:text-base break-words ${getMessageContainerStyle(msg.type)}`}
              >
                {renderMessageContent(msg)}
              </div>
            ))}
          </div>

          {/* 입력창 영역 */}
          <div className="relative flex gap-2 flex-shrink-0">
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-indigo-500 rounded-xl overflow-hidden shadow-2xl z-20"
                >
                  {suggestions.map((title) => (
                    <li 
                      key={title} 
                      onMouseDown={() => onSubmitAnswer(title)} 
                      className="p-3 cursor-pointer hover:bg-indigo-600 text-left border-b border-slate-700 last:border-0 transition-colors font-bold"
                    >
                      {title}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <input
              type="text"
              placeholder={quizLyrics ? "정답을 입력하세요!" : "대기 중..."}
              value={currentMessage}
              onChange={onMessageChange}
              onKeyDown={(e) => e.key === 'Enter' && onSubmitAnswer(null)}
              onBlur={() => setTimeout(() => setSuggestions([]), 200)}
              disabled={!quizLyrics}
              className="flex-grow bg-indigo-950 border-2 border-indigo-700 text-white rounded-xl p-4 text-lg focus:outline-none focus:border-sky-500 transition-colors placeholder-slate-500 disabled:opacity-50"
            />
            <button 
              onClick={() => onSubmitAnswer(null)} 
              disabled={!quizLyrics} 
              className="bg-rose-500 hover:bg-rose-600 disabled:bg-slate-600 text-white font-bold px-6 rounded-xl transition-colors shadow-lg"
            >
              입력
            </button>
          </div>
        </div>

        {/* --- 오른쪽 패널 (1/3): 점수판 --- */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 h-full min-h-0">
          <div className="bg-indigo-900 p-4 md:p-6 rounded-2xl flex flex-col h-full overflow-hidden">
            <h3 className="text-xl font-bold text-slate-200 mb-4 border-b border-indigo-800 pb-2 flex justify-between items-center flex-shrink-0">
              <span>🏆 점수판</span>
              <span className="text-sm text-slate-400 font-normal">{settings.isTeamMode ? '팀전' : '개인전'}</span>
            </h3>
            
            <div className="overflow-y-auto flex-grow pr-1 scrollbar-thin scrollbar-thumb-indigo-600 min-h-0">
              {settings.isTeamMode ? (
                <div className="flex flex-col gap-4">
                  {/* A팀 */}
                  <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-center">
                    <h4 className="text-red-400 font-bold text-xl mb-1">TEAM A</h4>
                    <p className="text-4xl font-black text-white">{teamScores.A}</p>
                    {/* [수정됨] Grid 적용: 2열 배치 */}
                    <div className="mt-3 text-left border-t border-red-500/20 pt-2 grid grid-cols-2 gap-2">
                      {sortedScoreboard.filter(([, p]) => p.team === 'A').map(([id, p]) => (
                        <TeamMemberCard key={id} player={p} />
                      ))}
                    </div>
                  </div>
                  {/* B팀 */}
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 text-center">
                    <h4 className="text-blue-400 font-bold text-xl mb-1">TEAM B</h4>
                    <p className="text-4xl font-black text-white">{teamScores.B}</p>
                    {/* [수정됨] Grid 적용: 2열 배치 */}
                    <div className="mt-3 text-left border-t border-blue-500/20 pt-2 grid grid-cols-2 gap-2">
                      {sortedScoreboard.filter(([, p]) => p.team === 'B').map(([id, p]) => (
                         <TeamMemberCard key={id} player={p} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence>
                    {sortedScoreboard.map(([id, player], index) => (
                      <motion.li
                        key={id}
                        layout
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          index === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : 
                          index === 1 ? 'bg-slate-400/20 border-slate-400/50' :
                          index === 2 ? 'bg-orange-700/20 border-orange-700/50' :
                          'bg-indigo-950 border-indigo-800'
                        }`}
                      >
                        <div className="relative">
                          <img src={getAvatar(player.avatar || 'av_1')} alt={player.nickname} className="w-10 h-10 rounded-full border border-white/20" />
                          {index < 3 && (
                            <div className="absolute -top-2 -right-1 text-sm">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0 text-left">
                          <div className="font-bold truncate">{player.nickname}</div>
                        </div>
                        <div className="font-mono font-bold text-xl text-sky-400">
                          {player.score}
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GameView;