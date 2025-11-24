import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion'; 
import { useSound } from '../context/SoundContext';
import VolumeControl from '../components/VolumeControl';
import robotSvg from '../LOGO/robot.svg';

const buttonAudio = new Audio('/sounds/button.ogg');
const chatAudio = new Audio('/sounds/chat.ogg');
const typingAudio = new Audio('/sounds/typing.ogg');

buttonAudio.volume = 0.2; buttonAudio.preload = 'auto';
chatAudio.volume = 0.4; chatAudio.preload = 'auto';
typingAudio.volume = 0.3; typingAudio.preload = 'auto';

const getAvatar = (avatarId) => {
  try { return new URL(`../AVATARS/${avatarId}.png`, import.meta.url).href; } 
  catch (e) { return new URL(`../AVATARS/av_1.png`, import.meta.url).href; }
};

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.9 } };

const GameTimer = ({ endTime, timerAudio, urgentTimerAudio }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const lastPlayedTime = useRef(-1);
  const { playSound } = useSound();

  useEffect(() => {
    if (!endTime) { setTimeLeft(0); return; }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((endTime - now) / 1000);
      if (diff <= 0) { setTimeLeft(0); clearInterval(interval); } 
      else {
        setTimeLeft(diff);
        if (lastPlayedTime.current !== diff) {
            lastPlayedTime.current = diff;
            // 10초 이하일 때 timer2.ogg, 그 외 timer.ogg 재생
            const soundToPlay = diff <= 10 ? (urgentTimerAudio || new Audio('/sounds/timer2.ogg')) : (timerAudio || new Audio('/sounds/timer.ogg'));
            playSound(soundToPlay);
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, [endTime, timerAudio, urgentTimerAudio, playSound]);

  if (!endTime || timeLeft <= 0) return <div className="w-16 h-16 md:w-20 md:h-20"></div>;
  const isUrgent = timeLeft <= 10;
  
  return (
    <div className="w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center relative flex-shrink-0">
      <motion.div key={isUrgent ? 'urgent' : 'normal'} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: isUrgent ? [1, 1.1, 1] : 1, opacity: 1, backgroundColor: isUrgent ? ['#b91c1c', '#ef4444', '#b91c1c'] : '#4f46e5' }} transition={{ duration: isUrgent ? 1 : 0.3, repeat: isUrgent ? Infinity : 0, ease: "easeInOut" }} className="absolute inset-0 m-auto w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg" />
      <div className="relative z-10 flex flex-col items-center">
        <div className={`text-[10px] md:text-xs font-bold mb-1 ${isUrgent ? 'text-rose-200 animate-pulse' : 'text-slate-200'}`}>남은 시간</div>
        <div className={`text-2xl md:text-3xl font-mono font-black tracking-widest ${isUrgent ? 'text-white' : 'text-white'} transition-all duration-300`}>{timeLeft}</div>
      </div>
    </div>
  );
};

const AnswerPopup = ({ data }) => {
  if (!data) return null;
  const isSuccess = data.type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-900/90 border-emerald-500' : 'bg-rose-900/90 border-rose-500';
  const titleColor = isSuccess ? 'text-emerald-300' : 'text-rose-300';
  const icon = isSuccess ? '🎉 정답! 🎉' : '⏰ 시간 종료';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className={`relative w-full max-w-lg ${bgColor} border-4 rounded-3xl p-6 md:p-8 shadow-2xl text-center pointer-events-auto`}>
        <h2 className={`text-3xl md:text-4xl font-black ${titleColor} mb-4 md:mb-6 drop-shadow-lg`}>{icon}</h2>
        {isSuccess && (<div className="mb-4 md:mb-6 bg-black/30 rounded-xl p-3 md:p-4"><p className="text-xl md:text-2xl text-white font-bold">{data.team ? `[${data.team}팀] ` : ''}{data.user}</p><p className="text-emerald-400 font-bold text-base md:text-lg mt-1">+{data.scoreGained}점 획득!</p></div>)}
        <div className="space-y-3 md:space-y-4 text-left bg-black/20 p-3 md:p-4 rounded-xl">
          <div><p className="text-xs md:text-sm text-slate-400 font-bold">곡 정보</p><p className="text-xl md:text-2xl text-white font-bold truncate">{data.artist} - {data.answer}</p></div>
          <div className="border-t border-white/10 pt-2"><p className="text-xs md:text-sm text-slate-400 font-bold">원곡 가사</p><p className="text-base md:text-lg text-slate-200 font-medium leading-snug">{data.originalLyrics}</p></div>
          <div className="border-t border-white/10 pt-2"><p className="text-xs md:text-sm text-slate-400 font-bold">번역 가사 (문제)</p><p className="text-base md:text-lg text-sky-200 font-medium leading-snug">{data.translatedLyrics}</p></div>
        </div>
        <div className="mt-4 md:mt-6 text-slate-400 text-xs md:text-sm animate-pulse">잠시 후 다음 라운드가 시작됩니다...</div>
      </motion.div>
    </div>
  );
};

const TeamMemberCard = ({ player }) => (<div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 min-w-0"><img src={getAvatar(player.avatar || 'av_1')} alt={player.nickname} className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/30 bg-slate-800 flex-shrink-0"/><span className="text-xs md:text-sm font-bold text-white truncate">{player.nickname}</span></div>);

const GameView = ({ roomState, quizLyrics = '', messages = [], teamScores = { A: 0, B: 0 }, sortedScoreboard = [], suggestions = [], currentMessage = '', onMessageChange, onSubmitAnswer, onGoBack, answerPopupData = null, currentHints = [], timerAudio, urgentTimerAudio, onOpenDescription }) => {
  const chatScrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('game');
  const inputControls = useAnimation();
  const { playSound } = useSound();

  useEffect(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, [messages]); 
  useEffect(() => { if (messages.length > 0) { const lastMsg = messages[messages.length - 1]; if (lastMsg.type === 'chat') playSound(chatAudio); } }, [messages, playSound]);
  useEffect(() => { if (currentMessage) inputControls.start({ scale: [1, 1.02, 1], transition: { duration: 0.2 } }); }, [currentMessage, inputControls]);

  const handleInputChange = (e) => {
    playSound(typingAudio);
    onMessageChange(e);
  };

  if (!roomState) return <div className="text-white">게임을 불러오는 중...</div>;
  const { settings, roomCode, gameState } = roomState;
  let collectionName = null; let roundInfo = null; let contentLyrics = quizLyrics;
  if (quizLyrics) {
    const splitIndex = quizLyrics.indexOf('\n');
    if (splitIndex !== -1) {
      const firstLine = quizLyrics.substring(0, splitIndex).trim();
      const match = firstLine.match(/^\[(.*?)\]\s*\((.*?)\)$/);
      if (match) { collectionName = match[1]; roundInfo = match[2]; contentLyrics = quizLyrics.substring(splitIndex + 1); } else { contentLyrics = quizLyrics; }
    }
  }

  const getMessageContainerStyle = (type) => {
    switch (type) { case 'hint': return 'bg-yellow-900/30 border-l-4 border-yellow-500'; case 'answer': return 'bg-emerald-900/30 border-l-4 border-emerald-500'; case 'answer_info': return 'bg-slate-800/50 pl-8 italic text-slate-300'; case 'system': return 'bg-rose-900/20 text-center font-bold text-rose-400'; case 'chat': default: return 'bg-slate-700/30 text-white'; }
  };

  const renderMessageContent = (msg) => {
    const teamMatch = msg.text.match(/^\[([AB])팀\]\s*\[?(.*?)\]?\s*:\s*(.*)$/); const individualMatch = msg.text.match(/^\[?(.*?)\]?\s*:\s*(.*)$/);
    if (teamMatch && (msg.type === 'chat' || msg.type === 'answer')) { const team = teamMatch[1]; const nickname = teamMatch[2]; const content = teamMatch[3]; const teamColor = team === 'A' ? 'text-red-400' : 'text-blue-400'; return (<><span className={`font-bold ${teamColor} mr-1`}>{nickname}</span><span className={msg.type === 'answer' ? 'text-emerald-400 font-bold' : 'text-slate-200'}>: {content}</span></>); } 
    else if (individualMatch && (msg.type === 'chat' || msg.type === 'answer')) { const nickname = individualMatch[1]; const content = individualMatch[2]; if (msg.type === 'hint' || msg.type === 'system') return msg.text; return (<><span className="font-bold text-white mr-1">{nickname}</span><span className={msg.type === 'answer' ? 'text-emerald-400 font-bold' : 'text-slate-200'}>: {content}</span></>); }
    return msg.text;
  };

  return (
    <div className="bg-slate-900 h-[100dvh] text-white p-3 md:p-8 relative flex flex-col overflow-hidden">
      <AnimatePresence>{answerPopupData && <AnswerPopup data={answerPopupData} />}</AnimatePresence>

      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { playSound(buttonAudio); onGoBack(); }} className="bg-indigo-900 text-slate-200 font-bold py-2 px-4 text-sm md:text-lg rounded-2xl hover:bg-indigo-800 transition md:py-3 md:px-8 md:!text-2xl">나가기</motion.button>
        <div className="flex flex-col items-center"><img src={robotSvg} alt="Robot Logo" className="w-8 h-8 md:w-12 md:h-12 mb-1" /><h2 className="text-xs md:text-lg text-slate-400">게임 진행 중</h2><p className="text-xl md:text-2xl font-bold text-rose-500 tracking-widest">{roomCode}</p></div>
        <div className="flex justify-end w-24">
            {/* ⭐ [수정] VolumeControl에 onOpenDescription 전달 */}
            <VolumeControl onOpenDescription={onOpenDescription} />
        </div>
      </div>

      <div className="flex md:hidden w-full bg-indigo-900/50 rounded-xl p-1 mb-2 flex-shrink-0">
        <button onClick={() => { playSound(buttonAudio); setActiveTab('game'); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'game' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400'}`}>🎮 게임</button>
        <button onClick={() => { playSound(buttonAudio); setActiveTab('score'); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'score' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}>🏆 점수판</button>
      </div>
      
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
        <div className={`w-full md:w-2/3 bg-indigo-900 p-3 md:p-6 rounded-2xl flex-col gap-3 md:gap-4 h-full min-h-0 relative ${activeTab === 'game' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex justify-between items-center flex-shrink-0 mb-1">
            <div className="flex-1 min-w-0 text-left">
               {collectionName ? (<div className="text-base md:text-xl font-bold text-white truncate pr-2"><span className="md:hidden text-rose-400 mr-2 text-xl">♪</span><span className="hidden md:inline text-rose-400 mr-2">Now Playing :</span>{collectionName}</div>) : (<div className="text-slate-500 text-xs md:text-sm font-bold">대기 중...</div>)}
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">{roundInfo && (<div className="text-lg md:text-2xl font-bold text-slate-400 whitespace-nowrap">{roundInfo}</div>)}<GameTimer endTime={gameState?.roundEndTime} timerAudio={timerAudio} urgentTimerAudio={urgentTimerAudio} /></div>
          </div>

          <div className="bg-black bg-opacity-30 p-4 md:p-6 rounded-xl min-h-[120px] md:min-h-[200px] flex items-center justify-center border border-indigo-700 shadow-inner flex-shrink-0">
            <div className="whitespace-pre-wrap text-xl md:text-3xl font-bold text-sky-300 leading-relaxed text-center break-keep">{contentLyrics || <span className="text-slate-500 animate-pulse text-base md:text-xl">다음 라운드를 준비하고 있습니다...</span>}</div>
          </div>

          <AnimatePresence>
            {currentHints && currentHints.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '0.5rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="flex-shrink-0 bg-yellow-500/20 border-l-4 border-yellow-500 p-2 rounded-r-lg text-left overflow-hidden">
                <div className="text-yellow-300 font-bold text-sm md:text-base flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                  <span className="text-base md:text-lg flex-shrink-0">💡</span>
                  {currentHints.map((hint, index) => (<React.Fragment key={`hint-${index}`}><span className="whitespace-nowrap">{hint}</span>{index < currentHints.length - 1 && <span className="text-yellow-500/50 mx-1">|</span>}</React.Fragment>))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatScrollRef} className="bg-black bg-opacity-20 p-3 md:p-4 rounded-xl flex-grow overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent min-h-0">
            {messages.map((msg, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }} className={`p-2 rounded-lg text-left text-xs md:text-base break-words ${getMessageContainerStyle(msg.type)}`}>{renderMessageContent(msg)}</motion.div>
            ))}
          </div>

          <div className="relative flex gap-2 flex-shrink-0">
            <AnimatePresence>
              {suggestions && suggestions.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-indigo-500 rounded-xl overflow-hidden shadow-2xl z-20 max-h-40 overflow-y-auto">
                  {suggestions.map((title, index) => (<li key={`suggestion-${index}`} onMouseDown={() => { playSound(buttonAudio); onSubmitAnswer(title); }} className="p-3 cursor-pointer hover:bg-indigo-600 text-left border-b border-slate-700 last:border-0 transition-colors font-bold text-sm md:text-base">{title}</li>))}
                </motion.ul>
              )}
            </AnimatePresence>
            <motion.input animate={inputControls} type="text" placeholder={quizLyrics ? "정답 입력" : "대기 중"} value={currentMessage} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && onSubmitAnswer(null)} disabled={!quizLyrics} className="flex-grow bg-indigo-950 border-2 border-indigo-700 text-white rounded-xl p-3 md:p-4 text-base md:text-lg focus:outline-none focus:border-sky-500 transition-colors placeholder-slate-500 disabled:opacity-50"/>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { playSound(buttonAudio); onSubmitAnswer(null); }} disabled={!quizLyrics} className="bg-rose-500 hover:bg-rose-600 disabled:bg-slate-600 text-white font-bold px-4 md:px-6 rounded-xl transition-colors shadow-lg whitespace-nowrap">입력</motion.button>
          </div>
        </div>

        <div className={`w-full md:w-1/3 flex-col gap-4 h-full min-h-0 ${activeTab === 'score' ? 'flex' : 'hidden md:flex'}`}>
          <div className="bg-indigo-900 p-3 md:p-6 rounded-2xl flex flex-col h-full overflow-hidden">
            <h3 className="text-lg md:text-xl font-bold text-slate-200 mb-3 md:mb-4 border-b border-indigo-800 pb-2 flex justify-between items-center flex-shrink-0"><span>🏆 점수판</span><span className="text-xs md:text-sm text-slate-400 font-normal">{settings.isTeamMode ? '팀전' : '개인전'}</span></h3>
            <div className="overflow-y-auto flex-grow pr-1 scrollbar-thin scrollbar-thumb-indigo-600 min-h-0">
              {settings.isTeamMode ? (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 md:p-4 text-center"><h4 className="text-red-400 font-bold text-lg md:text-xl mb-1">TEAM A</h4><p className="text-3xl md:text-4xl font-black text-white">{teamScores?.A || 0}</p><div className="mt-3 text-left border-t border-red-500/20 pt-2 grid grid-cols-2 gap-2">{sortedScoreboard.filter(([, p]) => p.team === 'A').map(([id, p]) => <TeamMemberCard key={id} player={p} />)}</div></div>
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 md:p-4 text-center"><h4 className="text-blue-400 font-bold text-lg md:text-xl mb-1">TEAM B</h4><p className="text-3xl md:text-4xl font-black text-white">{teamScores?.B || 0}</p><div className="mt-3 text-left border-t border-blue-500/20 pt-2 grid grid-cols-2 gap-2">{sortedScoreboard.filter(([, p]) => p.team === 'B').map(([id, p]) => <TeamMemberCard key={id} player={p} />)}</div></div>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence>
                    {sortedScoreboard.map(([id, player], index) => (
                      <motion.li key={id} layout variants={itemVariants} initial="hidden" animate="visible" exit="exit" className={`flex items-center gap-3 p-2 md:p-3 rounded-xl border ${index === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : index === 1 ? 'bg-slate-400/20 border-slate-400/50' : index === 2 ? 'bg-orange-700/20 border-orange-700/50' : 'bg-indigo-950 border-indigo-800'}`}>
                        <div className="relative"><img src={getAvatar(player.avatar || 'av_1')} alt={player.nickname} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20" />{index < 3 && <div className="absolute -top-2 -right-1 text-xs md:text-sm">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>}</div>
                        <div className="flex-grow min-w-0 text-left"><div className="font-bold truncate text-sm md:text-base">{player.nickname}</div></div>
                        <div className="font-mono font-bold text-lg md:text-xl text-sky-400">{player.score}</div>
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