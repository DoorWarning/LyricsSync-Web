// src/views/LobbyView.jsx
import React from 'react';
import GlobalHeader from '../components/GlobalHeader';

// [뷰 2] 대기실 (로비) 화면
const LobbyView = ({ 
  roomState, 
  myPlayerId,
  onGoBack, 
  onCopyLink, 
  onUpdateSettings, 
  onSelectTeam, 
  onReady, 
  onStartGame,
  allSongCollections 
}) => {
  
  if (!roomState) return <div>로딩 중...</div>;
  
  const { hostId, players, settings, roomCode } = roomState;
  const isHost = myPlayerId === hostId;
  const myPlayer = players[myPlayerId];
  
  const teamA = Object.entries(players).filter(([, p]) => p.team === 'A');
  const teamB = Object.entries(players).filter(([, p]) => p.team === 'B');
  const noTeam = Object.entries(players).filter(([, p]) => p.team === null);

  return (
    <div className="w-full">
      <GlobalHeader onBack={onGoBack} />
      
      <h2 className="text-[var(--secondary-text)]">
        방 코드: <span className="text-[var(--accent-pink)] font-bold bg-[var(--panel-bg)] px-3 py-1 rounded-lg">{roomCode}</span>
      </h2>

      <div className="flex flex-col md:flex-row gap-5 mt-8">
        
        {/* 플레이어 목록 (왼쪽) */}
        <div className="panel flex-1">
          <h3 className="text-lg font-bold border-b border-[var(--panel-bg)] pb-2 mb-4 text-left">
            플레이어 ({Object.keys(players).length}/{settings.maxPlayers})
          </h3>
          
          {settings.isTeamMode ? (
            // --- 팀전 뷰 ---
            <div className="flex gap-5">
              <div className="flex-1" data-team="A">
                <h4 className="text-[var(--team-a)] text-xl font-bold">A팀 ({teamA.length})</h4>
                {myPlayer?.team !== 'A' && (
                  <button onClick={() => onSelectTeam('A')} className="btn-blue w-full mb-3">A팀 참가</button>
                )}
                <ul className="list-none p-0 flex flex-col gap-2">
                  {teamA.map(([id, player]) => (
                    <li key={id} className="text-lg font-bold p-4 rounded-lg bg-[var(--accent-blue-dark)] flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#0F1524]"></span>
                      {player.nickname} {id === hostId ? '👑' : ''}
                      <span className={player.isReady ? 'text-green-400' : 'text-gray-500'}>
                        {player.isReady ? ' (R)' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1" data-team="B">
                <h4 className="text-[var(--team-b)] text-xl font-bold">B팀 ({teamB.length})</h4>
                {myPlayer?.team !== 'B' && (
                  <button onClick={() => onSelectTeam('B')} className="btn-blue w-full mb-3">B팀 참가</button>
                )}
                <ul className="list-none p-0 flex flex-col gap-2">
                  {teamB.map(([id, player]) => (
                    <li key={id} className="text-lg font-bold p-4 rounded-lg bg-[var(--accent-blue-dark)] flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#0F1524]"></span>
                      {player.nickname} {id === hostId ? '👑' : ''}
                      <span className={player.isReady ? 'text-green-400' : 'text-gray-500'}>
                        {player.isReady ? ' (R)' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            // --- 개인전 뷰 ---
            <ul className="list-none p-0 flex flex-col gap-2">
              {noTeam.map(([id, player]) => (
                <li key={id} className="text-lg font-bold p-4 rounded-lg bg-[var(--accent-blue-dark)] flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#0F1524]"></span>
                  {player.nickname} {id === hostId ? '👑' : ''}
                  <span className={player.isReady ? 'text-green-400' : 'text-gray-500'}>
                    {player.isReady ? ' (준비완료)' : ' (대기중)'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 게임 설정 (오른쪽) */}
        <div className="panel flex-1">
          <h3 className="text-lg font-bold border-b border-[var(--panel-bg)] pb-2 mb-4 text-left">
            게임 설정 {isHost ? '' : '(현재 설정)'}
          </h3>
          
          <div className="text-left mb-4">
            <label className="font-bold text-lg">
              <input
                type="checkbox"
                name="isTeamMode"
                checked={settings.isTeamMode}
                onChange={onUpdateSettings}
                disabled={!isHost}
                className="mr-2"
              />
              팀전
            </label>
          </div>

          <div className="text-left mb-4">
            <label className="block mb-1 font-bold">최대 인원</label>
            {isHost ? (
              <select name="maxPlayers" value={settings.maxPlayers} onChange={onUpdateSettings} className="w-full p-2 rounded bg-[#2F3B5D] border-0 text-white">
                <option value={4}>4명</option>
                <option value={6}>6명</option>
                <option value={8}>8명</option>
                <option value={10}>10명</option>
              </select>
            ) : (
              <strong>{settings.maxPlayers}명</strong>
            )}
          </div>
          
          <div className="text-left mb-4">
            <label className="block mb-1 font-bold">라운드 수</label>
            {isHost ? (
              <select name="maxRounds" value={settings.maxRounds} onChange={onUpdateSettings} className="w-full p-2 rounded bg-[#2F3B5D] border-0 text-white">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            ) : (
              <strong>{settings.maxRounds}</strong>
            )}
          </div>
          
          <div className="text-left">
            <label className="block mb-2 font-bold">곡 모음집 목록</label>
              <div className="flex flex-col gap-2">
                {allSongCollections.map(collection => (
                  <div className="flex items-center justify-between bg-[var(--accent-blue-dark)] p-3 rounded-lg" key={collection.id}>
                    <span className="font-bold">{collection.name}</span>
                    <input
                      type="checkbox"
                      name="songCollections"
                      value={collection.id}
                      checked={settings.songCollections.includes(collection.id)}
                      onChange={onUpdateSettings}
                      disabled={!isHost}
                      className="form-checkbox h-5 w-5 text-[var(--accent-pink)] bg-gray-600 border-gray-500 rounded focus:ring-pink-500"
                    />
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-4 mt-5">
        <button onClick={onCopyLink} className="btn-blue h-12">
          초대 링크 복사
        </button>
        
        {!isHost && myPlayer && (
          <button 
            onClick={onReady} 
            className={myPlayer.isReady ? "btn-secondary" : "btn-blue"}
            style={{ height: '50px' }}
            disabled={settings.isTeamMode && !myPlayer.team}
          >
            {myPlayer.isReady ? '준비 취소' : (settings.isTeamMode && !myPlayer.team ? '팀을 선택하세요' : '준비 완료')}
          </button>
        )}
        {isHost && (
          <button onClick={onStartGame} className="btn-primary h-12">
            시작
          </button>
        )}
      </div>
    </div>
  );
};

export default LobbyView;