// src/components/FinalScoreboardPopup.jsx
import React from 'react';

const FinalScoreboardPopup = ({ data, onClose }) => {
  const { scores, isTeamMode } = data;
  let sortedScores;

  if (isTeamMode) {
    sortedScores = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  } else {
    sortedScores = Object.entries(scores).sort(([, playerA], [, playerB]) => playerB.score - playerA.score);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="mt-0">🏆 최종 점수</h2>
        <ul className="list-none p-0">
          {isTeamMode ? (
            sortedScores.map(([team, score]) => (
              <li key={team} data-team={team} className={`text-lg mb-2 font-bold ${team === 'A' ? 'text-[var(--team-a)]' : 'text-[var(--team-b)]'}`}>
                {team}팀: {score}점
              </li>
            ))
          ) : (
            sortedScores.map(([id, player]) => (
              <li key={id} className="text-lg mb-2 font-bold">{player.nickname}: {player.score}점</li>
            ))
          )}
        </ul>
        <button onClick={onClose} className="btn-blue">닫기</button>
      </div>
    </div>
  );
};

export default FinalScoreboardPopup;