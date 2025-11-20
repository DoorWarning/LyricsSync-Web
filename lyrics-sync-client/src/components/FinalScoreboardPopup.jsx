// src/components/FinalScoreboardPopup.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const getAvatar = (avatarId) => {
  try { return new URL(`../AVATARS/${avatarId}.png`, import.meta.url).href; } 
  catch (e) { return new URL(`../AVATARS/av_1.png`, import.meta.url).href; }
};

const FinalScoreboardPopup = ({ data, onClose }) => {
  const { scores, isTeamMode } = data;

  const sortedPlayers = useMemo(() => {
    if (isTeamMode) return [];
    return Object.values(scores).sort((a, b) => b.score - a.score);
  }, [scores, isTeamMode]);

  const teamResult = useMemo(() => {
    if (!isTeamMode) return null;
    const scoreA = scores['A'] || 0;
    const scoreB = scores['B'] || 0;
    let winner = 'DRAW';
    if (scoreA > scoreB) winner = 'A';
    else if (scoreB > scoreA) winner = 'B';
    return { scoreA, scoreB, winner };
  }, [scores, isTeamMode]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
      <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full max-w-2xl bg-slate-900 border-4 border-indigo-500 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-indigo-900/50 p-6 text-center border-b border-indigo-500/30">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-rose-500 to-purple-500 drop-shadow-lg animate-pulse">GAME OVER</h2>
          <p className="text-slate-300 font-bold mt-2">최종 결과 발표</p>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent">
          {isTeamMode ? (
            <div className="flex flex-col gap-6">
              <div className="text-center mb-4">
                {teamResult.winner === 'DRAW' ? <h3 className="text-3xl font-bold text-slate-200">무승부!</h3> : <h3 className="text-4xl font-black text-yellow-400">🎉 {teamResult.winner}팀 승리! 🎉</h3>}
              </div>
              <div className="flex gap-4 justify-center items-stretch">
                <div className={`flex-1 p-6 rounded-2xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${teamResult.winner === 'A' ? 'bg-red-900/40 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] scale-105 z-10' : 'bg-red-900/20 border-red-800 opacity-70'}`}>
                  <h4 className="text-2xl font-bold text-red-400">TEAM A</h4>
                  <p className="text-5xl font-black text-white">{teamResult.scoreA}</p>
                </div>
                <div className={`flex-1 p-6 rounded-2xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${teamResult.winner === 'B' ? 'bg-blue-900/40 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] scale-105 z-10' : 'bg-blue-900/20 border-blue-800 opacity-70'}`}>
                  <h4 className="text-2xl font-bold text-blue-400">TEAM B</h4>
                  <p className="text-5xl font-black text-white">{teamResult.scoreB}</p>
                </div>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {sortedPlayers.map((player, index) => {
                let rankStyle = 'bg-indigo-950/50 border-indigo-800';
                let rankIcon = null;
                let scoreColor = 'text-slate-300';
                if (index === 0) { rankStyle = 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]'; rankIcon = '👑'; scoreColor = 'text-yellow-400'; }
                else if (index === 1) { rankStyle = 'bg-slate-400/20 border-slate-400'; rankIcon = '🥈'; scoreColor = 'text-slate-300'; }
                else if (index === 2) { rankStyle = 'bg-orange-700/20 border-orange-700'; rankIcon = '🥉'; scoreColor = 'text-orange-400'; }

                return (
                  <motion.li key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${rankStyle}`}>
                    <div className="w-8 text-center text-2xl font-bold flex-shrink-0">{rankIcon || (index + 1)}</div>
                    <div className="relative">
                       <img src={getAvatar(player.avatar || 'av_1')} alt="avatar" className={`w-14 h-14 rounded-full bg-slate-800 object-cover ${index === 0 ? 'border-2 border-yellow-400' : ''}`}/>
                    </div>
                    <div className="flex-grow text-left min-w-0">
                      <div className={`font-bold text-xl truncate ${index === 0 ? 'text-yellow-200' : 'text-white'}`}>{player.nickname}</div>
                      {index === 0 && <div className="text-xs text-yellow-500 font-bold">WINNER</div>}
                    </div>
                    <div className={`text-2xl font-mono font-black ${scoreColor}`}>{player.score}</div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-slate-900">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white text-xl font-bold rounded-2xl shadow-lg transition-colors">
            로비로 돌아가기
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default FinalScoreboardPopup;