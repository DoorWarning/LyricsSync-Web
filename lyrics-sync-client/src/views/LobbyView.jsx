// src/views/LobbyView.jsx
import React from 'react';
import robotSvg from '../LOGO/robot.svg'; // robot.svg 임포트

// 아바타 이미지를 동적으로 가져오기 위한 함수
const getAvatar = (avatarId) => {
  try {
    // Vite에서 동적 자산 임포트를 처리하는 방식
    return new URL(`../AVATARS/${avatarId}.png`, import.meta.url).href;
  } catch (e) {
    console.error(`Avatar ${avatarId} not found`, e);
    // 기본 아바타나 에러 이미지를 반환할 수 있습니다.
    return new URL(`../AVATARS/av_1.png`, import.meta.url).href;
  }
};


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
  
  if (!roomState) return <div className="text-white">로딩 중...</div>;
  
  const { hostId, players, settings, roomCode } = roomState;
  const isHost = myPlayerId === hostId;
  const myPlayer = players[myPlayerId];
  
  const teamA = Object.entries(players).filter(([, p]) => p.team === 'A');
  const teamB = Object.entries(players).filter(([, p]) => p.team === 'B');
  const noTeam = Object.entries(players).filter(([, p]) => !p.team);


  // 플레이어 카드 컴포넌트
  const PlayerCard = ({ id, player }) => (
    <div className={`w-full p-4 rounded-2xl flex items-center gap-4 ${myPlayerId === id ? 'bg-sky-500/50' : 'bg-sky-400'}`}>
      <img src={getAvatar(player.avatar || 'av_1')} alt={player.nickname} className="w-12 h-12 rounded-full border-2 border-white" />
      <div className="flex-grow text-left">
        <p className="text-xl font-bold text-slate-200">
          {player.nickname}
          {id === hostId && ' 👑'}
        </p>
      </div>
      <div className={`w-24 text-center py-1 rounded-full text-sm font-bold ${player.isReady ? 'bg-green-400 text-black' : 'bg-gray-600 text-white'}`}>
        {player.isReady ? '준비완료' : '대기중'}
      </div>
    </div>
  );

  // 오른쪽 설정 패널(방장용)
  const HostSettings = () => (
    <>
      <div className="mb-4">
        <label className="block text-slate-200 text-left font-bold mb-2">팀전</label>
        <label htmlFor="team-mode-toggle" className="flex items-center cursor-pointer">
          <div className="relative">
            <input type="checkbox" id="team-mode-toggle" className="sr-only" name="isTeamMode" checked={settings.isTeamMode} onChange={onUpdateSettings} />
            <div className={`block w-14 h-8 rounded-full ${settings.isTeamMode ? 'bg-rose-500' : 'bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.isTeamMode ? 'transform translate-x-full' : ''}`}></div>
          </div>
        </label>
      </div>
       <div className="mb-4">
        <label className="block text-slate-200 text-left font-bold mb-2">라운드 수</label>
        <select name="maxRounds" value={settings.maxRounds} onChange={onUpdateSettings} className="w-full p-3 rounded-lg bg-indigo-950 border border-slate-700 text-white">
          {[5, 10, 15, 20].map(num => <option key={num} value={num}>{num}라운드</option>)}
        </select>
      </div>
      <div>
        <label className="block text-slate-200 text-left font-bold mb-2">곡 모음집</label>
        <div className="space-y-2">
          {allSongCollections.map(collection => (
            <label key={collection.id} className="flex items-center justify-between bg-sky-400 p-3 rounded-lg cursor-pointer hover:bg-sky-500">
              <span className="font-bold text-slate-800">{collection.name}</span>
              <input
                type="checkbox"
                name="songCollections"
                value={collection.id}
                checked={settings.songCollections.includes(collection.id)}
                onChange={onUpdateSettings}
                className="form-checkbox h-6 w-6 text-rose-500 bg-gray-600 border-gray-500 rounded focus:ring-rose-500"
              />
            </label>
          ))}
        </div>
      </div>
    </>
  );

  // 오른쪽 설정 패널(일반 유저용)
  const PlayerSettings = () => (
    <>
      <div className="mb-4 text-left">
        <p className="font-bold text-slate-400">팀전</p>
        <p className="text-xl font-bold">{settings.isTeamMode ? "활성화" : "비활성화"}</p>
      </div>
      <div className="mb-4 text-left">
        <p className="font-bold text-slate-400">라운드 수</p>
        <p className="text-xl font-bold">{settings.maxRounds} 라운드</p>
      </div>
      <div className="text-left">
        <p className="font-bold text-slate-400 mb-2">선택된 곡 모음집</p>
        <div className="space-y-2">
          {settings.songCollections.map(id => {
            const collection = allSongCollections.find(c => c.id === id);
            return <div key={id} className="bg-sky-400 text-slate-800 font-bold p-3 rounded-lg">{collection ? collection.name : id}</div>;
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-slate-900 min-h-screen text-white p-4 md:p-8">
      {/* --- 헤더 --- */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onGoBack} className="bg-indigo-900 text-slate-200 font-bold py-3 px-6 rounded-2xl hover:bg-indigo-800 transition">
          뒤로
        </button>
        <div className="flex flex-col items-center">
            <img src={robotSvg} alt="Robot Logo" className="w-12 h-12 mb-2" />
            <h2 className="text-lg text-slate-400">방 코드</h2>
            <p className="text-2xl font-bold text-rose-500 tracking-widest">{roomCode}</p>
        </div>
        <div className="w-24"></div> {/* Placeholder for right alignment */}
      </div>
      
      {/* --- 메인 컨텐츠 (데스크탑: 2단, 모바일: 1단) --- */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8">

        {/* --- 왼쪽 패널: 플레이어 설정 및 목록 --- */}
        <div className="w-full md:w-2/3 bg-indigo-900 p-6 rounded-2xl flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-center">
            <div className="sm:col-span-2">
              <h3 className="text-2xl font-bold text-rose-500">
                플레이어 {Object.keys(players).length} / {settings.maxPlayers}
              </h3>
            </div>
            {isHost && (
              <div>
                <label className="block text-slate-300 text-sm font-bold mb-1">최대 인원</label>
                <select name="maxPlayers" value={settings.maxPlayers} onChange={onUpdateSettings} className="w-full p-2 rounded-lg bg-indigo-950 border border-slate-700 text-white">
                  {[2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={num}>{num}명</option>)}
                </select>
              </div>
            )}
          </div>

          {/* 플레이어 목록 컨테이너 */}
          <div className="bg-black bg-opacity-20 p-4 rounded-xl space-y-3 flex-grow overflow-y-auto">
            {settings.isTeamMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* A팀 */}
                <div>
                  <h4 className="text-xl font-bold text-red-400 mb-2 text-center">TEAM A ({teamA.length})</h4>
                  {myPlayer && myPlayer.team !== 'A' && (
                     <button onClick={() => onSelectTeam('A')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg mb-2 transition">A팀 참가</button>
                  )}
                  <div className="space-y-3">
                    {teamA.map(([id, player]) => <PlayerCard key={id} id={id} player={player} />)}
                  </div>
                </div>
                {/* B팀 */}
                <div>
                  <h4 className="text-xl font-bold text-blue-400 mb-2 text-center">TEAM B ({teamB.length})</h4>
                   {myPlayer && myPlayer.team !== 'B' && (
                     <button onClick={() => onSelectTeam('B')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-2 transition">B팀 참가</button>
                  )}
                  <div className="space-y-3">
                    {teamB.map(([id, player]) => <PlayerCard key={id} id={id} player={player} />)}
                  </div>
                </div>
              </div>
            ) : (
              noTeam.map(([id, player]) => <PlayerCard key={id} id={id} player={player} />)
            )}
          </div>
        </div>

        {/* --- 오른쪽 패널: 게임 설정 & 버튼 --- */}
        <div className="w-full md:w-1/3 flex flex-col justify-between gap-6">
          <div className="bg-indigo-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold text-slate-200 mb-4">게임 설정</h3>
            <div className="bg-black bg-opacity-20 p-4 rounded-xl max-h-[45vh] overflow-y-auto">
              {isHost ? <HostSettings /> : <PlayerSettings />}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-10">
            <button onClick={onCopyLink} className="bg-indigo-900 text-slate-200 font-bold py-3 rounded-2xl hover:bg-indigo-800 transition h-14 !text-2xl">
              초대
            </button>
            
            {isHost ? (
              <button onClick={onStartGame} className="bg-rose-500 text-white font-bold py-3 rounded-2xl hover:bg-rose-600 transition h-14 !text-2xl">
                시작
              </button>
            ) : (
              <button 
                onClick={onReady} 
                className={`font-bold py-4 rounded-2xl transition h-20 text-xl ${
                  myPlayer?.isReady 
                    ? "bg-gray-500 hover:bg-gray-600 text-white" 
                    : "bg-sky-400 hover:bg-sky-500 text-slate-900"
                }`}
                disabled={settings.isTeamMode && !myPlayer?.team}
              >
                {myPlayer?.isReady ? '준비 취소' : (settings.isTeamMode && !myPlayer?.team ? '팀 선택 필요' : '준비 완료')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyView;