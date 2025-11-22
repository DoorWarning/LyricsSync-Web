import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../context/SoundContext';
import VolumeControl from '../components/VolumeControl';
import robotSvg from '../LOGO/robot.svg';

// --- [오디오 설정] 로컬 UI용 ---
const buttonAudio = new Audio('/sounds/button.ogg'); 
const selectAudio = new Audio('/sounds/select.ogg');   
const alertAudio = new Audio('/sounds/result.ogg'); 

buttonAudio.volume = 0.2; buttonAudio.preload = 'auto'; 
selectAudio.volume = 0.5; selectAudio.preload = 'auto';
alertAudio.volume = 0.5; alertAudio.preload = 'auto';

const getAvatar = (avatarId) => {
  try { return new URL(`../AVATARS/${avatarId}.png`, import.meta.url).href; } 
  catch (e) { return new URL(`../AVATARS/av_1.png`, import.meta.url).href; }
};

const getSafeList = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string' && data.length > 0) return [data];
  return [];
};

const desktopReadyVariants = {
  ready: { backgroundColor: '#4ade80', color: '#000000' },
  waiting: { backgroundColor: '#4b5563', color: '#ffffff' },
  host: { backgroundColor: '#f43f5e', color: '#ffffff' }
};

const mobileReadyVariants = {
  ready: { backgroundColor: '#4ade80' },
  waiting: { backgroundColor: '#4b5563' },
  host: { backgroundColor: '#f43f5e' }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.5, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 20, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.5, y: -20, transition: { duration: 0.2 } }
};

const CustomCheckbox = ({ checked }) => {
  return (
    <motion.div 
      key={checked ? 'checked' : 'unchecked'}
      initial={{ scale: 0.8 }} animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${checked ? 'bg-rose-500 border-rose-500' : 'bg-slate-800 border-slate-500 hover:border-slate-400'}`}
    >
      {checked && (
        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></motion.svg>
      )}
    </motion.div>
  );
};

const CustomAlert = ({ isOpen, message, type = 'error', onClose }) => {
  const { playSound } = useSound();
  useEffect(() => { if (isOpen) playSound(alertAudio); }, [isOpen, playSound]);

  const isSuccess = type === 'success';
  const borderColor = isSuccess ? 'border-emerald-500' : 'border-rose-500';
  const buttonColor = isSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600';
  const icon = isSuccess ? '✅' : '⚠️';
  const title = isSuccess ? '성공' : '알림';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { playSound(buttonAudio); onClose(); }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className={`relative w-full max-w-sm bg-slate-800 border-2 ${borderColor} rounded-2xl p-6 shadow-2xl text-center`}>
            <div className="mb-4 text-5xl">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-300 mb-6 word-keep-all whitespace-pre-wrap">{message}</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { playSound(buttonAudio); onClose(); }} className={`w-full py-3 ${buttonColor} text-white font-bold rounded-xl transition shadow-lg`}>확인</motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const DesktopPlayerCard = React.memo(({ id, player, hostId, myPlayerId }) => {
  const isHost = id === hostId;
  const statusKey = isHost ? 'host' : (player.isReady ? 'ready' : 'waiting');
  const statusText = isHost ? '방장' : (player.isReady ? '준비완료' : '대기중');
  return (
    <motion.div layout variants={cardVariants} initial="hidden" animate="visible" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 25 }} className={`w-full p-4 rounded-2xl hidden sm:flex items-center gap-4 ${myPlayerId === id ? 'bg-sky-500/50' : 'bg-sky-400'}`}>
      <img src={getAvatar(player.avatar || 'av_1')} alt={player.nickname} className="w-12 h-12 rounded-full border-2 border-white" />
      <div className="flex-grow text-left"><p className="text-xl font-bold text-slate-200">{player.nickname}{isHost && ' 👑'}</p></div>
      <motion.div className="w-24 text-center py-1 rounded-full text-sm font-bold shadow-md" variants={desktopReadyVariants} initial={statusKey} animate={statusKey} transition={{ duration: 0.3 }}>{statusText}</motion.div>
    </motion.div>
  );
}, (prev, next) => prev.player.isReady === next.player.isReady && prev.player.avatar === next.player.avatar && prev.player.nickname === next.player.nickname && prev.hostId === next.hostId);

const MobilePlayerCard = React.memo(({ id, player, hostId, myPlayerId }) => {
  const isHost = id === hostId;
  const statusKey = isHost ? 'host' : (player.isReady ? 'ready' : 'waiting');
  return (
    <motion.div layout variants={cardVariants} initial="hidden" animate="visible" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 25 }} className={`w-full flex-shrink-0 flex sm:hidden flex-col items-center gap-1 p-2 rounded-2xl ${myPlayerId === id ? 'bg-sky-500/50' : 'bg-sky-400'}`}>
      <motion.div className="relative p-1 rounded-full" variants={mobileReadyVariants} initial={statusKey} animate={statusKey} transition={{ duration: 0.3 }}>
        <img src={getAvatar(player.avatar || 'av_1')} alt={player.nickname} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-slate-800" />
        {isHost && <div className="absolute -top-1 -right-1 text-lg sm:text-xl drop-shadow-md">👑</div>}
      </motion.div>
      <p className="text-xs sm:text-sm font-bold text-slate-200 truncate w-full text-center">{player.nickname}</p>
    </motion.div>
  );
}, (prev, next) => prev.player.isReady === next.player.isReady && prev.player.avatar === next.player.avatar && prev.hostId === next.hostId);

const ActionButtons = ({ isHost, myPlayer, settings, onCopyLink, onStartGame, onReady, isMobile }) => {
    const { playSound } = useSound();
    return (
        <div className={isMobile ? "fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 border-t border-indigo-500/30 backdrop-blur-md z-50 grid grid-cols-2 gap-4 md:hidden safe-area-bottom" : "grid grid-cols-2 gap-10 hidden md:grid"}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { playSound(buttonAudio); onCopyLink(); }} className={`bg-indigo-900 text-slate-200 font-bold rounded-2xl hover:bg-indigo-800 transition ${isMobile ? 'py-3 text-lg' : 'py-3 h-14 !text-2xl'}`}>초대</motion.button>
            {isHost ? (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { playSound(buttonAudio); onStartGame(); }} className={`bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition ${isMobile ? 'py-3 text-lg' : 'py-3 h-14 !text-2xl'}`}>시작</motion.button>
            ) : (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { playSound(buttonAudio); onReady(); }} className={`font-bold rounded-2xl transition ${isMobile ? 'py-3 text-lg' : 'py-3 h-14 !text-2xl'} ${myPlayer?.isReady ? "bg-gray-500 hover:bg-gray-600 text-white" : "bg-sky-400 hover:bg-sky-500 text-slate-900"}`} disabled={settings.isTeamMode && !myPlayer?.team}>{myPlayer?.isReady ? '취소' : (settings.isTeamMode && !myPlayer?.team ? '팀 선택' : '준비')}</motion.button>
            )}
        </div>
    );
};

const LobbyView = ({ roomState, myPlayerId, onGoBack, onUpdateSettings, onSelectTeam, onReady, onStartGame, allSongCollections }) => {
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', type: 'error' });
  const [activeTab, setActiveTab] = useState('players'); 
  const { playSound } = useSound();
  
  const closeAlert = () => setAlertInfo({ ...alertInfo, isOpen: false });
  if (!roomState) return <div className="text-white">로딩 중...</div>;
  
  const { hostId, players, settings, roomCode } = roomState;
  const isHost = myPlayerId === hostId;
  const myPlayer = players[myPlayerId];
  const teamA = Object.entries(players).filter(([, p]) => p.team === 'A');
  const teamB = Object.entries(players).filter(([, p]) => p.team === 'B');
  const noTeam = Object.entries(players).filter(([, p]) => !p.team);
  const spring = { type: "spring", stiffness: 700, damping: 30 };

  const handleCopyLink = async () => {
    try {
        const inviteUrl = `${window.location.origin}/${roomCode}`; 
        await navigator.clipboard.writeText(inviteUrl);
        setAlertInfo({ isOpen: true, message: `초대 링크가 복사되었습니다!`, type: 'success' });
    } catch (err) {
        setAlertInfo({ isOpen: true, message: '링크 복사에 실패했습니다.', type: 'error' });
    }
  };

  const handleMaxPlayersChange = (e) => {
    const newMax = parseInt(e.target.value, 10);
    if (newMax < Object.keys(players).length) {
        setAlertInfo({ isOpen: true, message: `현재 인원(${Object.keys(players).length}명)보다 적게 설정할 수 없습니다.`, type: 'error' });
        return;
    }
    playSound(selectAudio);
    onUpdateSettings(e);
  };

  const handleStartGame = () => {
    const playerList = Object.values(players); 
    if (playerList.length < 2) { setAlertInfo({ isOpen: true, message: '게임을 시작하려면 최소 2명의 플레이어가 필요합니다.', type: 'error' }); return; }
    if (settings.isTeamMode) {
       const noTeamPlayers = playerList.filter(p => !p.team);
       if (noTeamPlayers.length > 0) { setAlertInfo({ isOpen: true, message: '아직 팀을 선택하지 않은 플레이어가 있습니다!', type: 'error' }); return; }
       const teamACount = playerList.filter(p => p.team === 'A').length;
       const teamBCount = playerList.filter(p => p.team === 'B').length;
       if (teamACount === 0 || teamBCount === 0) { setAlertInfo({ isOpen: true, message: '양 팀에 최소 1명 이상의 플레이어가 필요합니다.', type: 'error' }); return; }
    }
    const notReadyPlayers = Object.entries(players).filter(([id, p]) => { if (id === hostId) return false; return !p.isReady; });
    if (notReadyPlayers.length > 0) { setAlertInfo({ isOpen: true, message: `아직 준비하지 않은 플레이어가 있습니다!`, type: 'error' }); return; }
    const safeCollections = getSafeList(settings.songCollections);
    const validSelectedCollections = safeCollections.filter(id => allSongCollections.some(collection => collection.id === id));
    if (validSelectedCollections.length === 0) { setAlertInfo({ isOpen: true, message: '최소 한 개의 곡 모음집을 선택해야 합니다!', type: 'error' }); return; }
    onStartGame();
  };

  return (
    <div className="bg-slate-900 min-h-screen text-white p-4 md:p-8 pb-24 md:pb-8 relative">
      <CustomAlert isOpen={alertInfo.isOpen} message={alertInfo.message} type={alertInfo.type} onClose={closeAlert} />

      <div className="flex justify-between items-center mb-6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { playSound(buttonAudio); onGoBack(); }} className="bg-indigo-900 text-slate-200 font-bold py-2 px-4 text-lg rounded-2xl hover:bg-indigo-800 transition md:py-3 md:px-8 md:!text-2xl">뒤로</motion.button>
        <div className="flex flex-col items-center"><img src={robotSvg} alt="Robot Logo" className="w-12 h-12 mb-2" /><h2 className="text-lg text-slate-400">방 코드</h2><p className="text-2xl font-bold text-rose-500 tracking-widest">{roomCode}</p></div>
        <div className="flex justify-end w-24"><VolumeControl /></div>
      </div>

      <div className="flex md:hidden w-full bg-indigo-900/50 rounded-xl p-1 mb-4 flex-shrink-0 sticky top-0 z-10 backdrop-blur-sm">
        <button onClick={() => { playSound(buttonAudio); setActiveTab('players'); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'players' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400'}`}>👥 플레이어 ({Object.keys(players).length})</button>
        <button onClick={() => { playSound(buttonAudio); setActiveTab('settings'); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'settings' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}>⚙️ 설정</button>
      </div>
      
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        <div className={`w-full md:w-2/3 bg-indigo-900 p-6 rounded-2xl flex-col ${activeTab === 'players' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 items-center">
            <h3 className="text-lg sm:text-2xl font-bold text-rose-500 text-center sm:text-left">플레이어 {Object.keys(players).length} / {settings.maxPlayers}</h3>
            {isHost && (<div className="flex-shrink-0 w-full sm:w-auto"><label className="block text-slate-300 text-sm font-bold mb-1">최대 인원</label><select name="maxPlayers" value={settings.maxPlayers} onChange={handleMaxPlayersChange} className="w-full p-2 rounded-lg bg-indigo-950 border border-slate-700 text-white">{[2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={num}>{num}명</option>)}</select></div>)}
          </div>
          <div className="bg-black bg-opacity-20 p-2 sm:p-4 rounded-xl flex-grow overflow-y-auto">
            {settings.isTeamMode ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 h-full content-start">
                <div className="flex flex-col items-center bg-red-900/20 rounded-xl p-2 h-full">
                  <h4 className="text-sm sm:text-xl font-bold text-red-400 mb-2 text-center">TEAM A ({teamA.length})</h4>
                  {myPlayer && myPlayer.team !== 'A' && (<motion.button whileTap={{ scale: 0.9 }} onClick={() => { playSound(buttonAudio); onSelectTeam('A'); }} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 text-sm sm:py-2 sm:px-4 sm:text-base rounded-lg mb-2 transition">참가</motion.button>)}
                  <div className="w-full flex flex-col gap-2"><AnimatePresence>{teamA.map(([id, player]) => (<React.Fragment key={id}><DesktopPlayerCard id={id} player={player} hostId={hostId} myPlayerId={myPlayerId} /><MobilePlayerCard id={id} player={player} hostId={hostId} myPlayerId={myPlayerId} /></React.Fragment>))}</AnimatePresence></div>
                </div>
                <div className="flex flex-col items-center bg-blue-900/20 rounded-xl p-2 h-full">
                  <h4 className="text-sm sm:text-xl font-bold text-blue-400 mb-2 text-center">TEAM B ({teamB.length})</h4>
                    {myPlayer && myPlayer.team !== 'B' && (<motion.button whileTap={{ scale: 0.9 }} onClick={() => { playSound(buttonAudio); onSelectTeam('B'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 text-sm sm:py-2 sm:px-4 sm:text-base rounded-lg mb-2 transition">참가</motion.button>)}
                  <div className="w-full flex flex-col gap-2"><AnimatePresence>{teamB.map(([id, player]) => (<React.Fragment key={id}><DesktopPlayerCard id={id} player={player} hostId={hostId} myPlayerId={myPlayerId} /><MobilePlayerCard id={id} player={player} hostId={hostId} myPlayerId={myPlayerId} /></React.Fragment>))}</AnimatePresence></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <AnimatePresence>{noTeam.map(([id, player]) => (<React.Fragment key={id}><DesktopPlayerCard id={id} player={player} hostId={hostId} myPlayerId={myPlayerId} /><MobilePlayerCard id={id} player={player} hostId={hostId} myPlayerId={myPlayerId} /></React.Fragment>))}</AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className={`w-full md:w-1/3 flex-col justify-between gap-6 ${activeTab === 'settings' ? 'flex' : 'hidden md:flex'}`}>
          <div className="bg-indigo-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold text-slate-200 mb-4">게임 설정</h3>
            <div className="bg-black bg-opacity-20 p-4 rounded-xl max-h-[60vh] md:max-h-[45vh] overflow-y-auto">
              {isHost ? (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1"><label className="block text-slate-200 text-left font-bold mb-2">팀전</label><div className={`flex items-center w-14 h-8 p-1 rounded-full cursor-pointer transition-colors ${settings.isTeamMode ? 'bg-rose-500' : 'bg-gray-600'}`} onClick={() => { playSound(selectAudio); onUpdateSettings({ target: { name: 'isTeamMode', type: 'checkbox', checked: !settings.isTeamMode }})}}><motion.div className="w-6 h-6 bg-white rounded-full shadow-md" animate={{ x: settings.isTeamMode ? 24 : 0 }} transition={spring} /></div></div>
                    <div className="flex-1"><label className="block text-slate-200 text-left font-bold mb-2">라운드 수</label><select name="maxRounds" value={settings.maxRounds} onChange={(e) => { playSound(selectAudio); onUpdateSettings(e); }} className="w-full p-3 rounded-lg bg-indigo-950 border border-slate-700 text-white">{[5, 10, 15, 20].map(num => <option key={num} value={num}>{num}라운드</option>)}</select></div>
                  </div>
                  <div><label className="block text-slate-200 text-left font-bold mb-2">곡 모음집</label><div className="space-y-2">{allSongCollections.map(collection => { const currentList = getSafeList(settings.songCollections); const isChecked = currentList.includes(collection.id); return (<div key={collection.id} onClick={() => { playSound(selectAudio); onUpdateSettings({ target: { name: 'songCollections', value: collection.id, type: 'checkbox', checked: !isChecked }}); }} className="flex items-center justify-between bg-sky-400 p-3 rounded-lg cursor-pointer hover:bg-sky-500 transition-colors select-none"><span className="font-bold text-slate-800">{collection.name}</span><div className="pointer-events-none"><CustomCheckbox name="songCollections" value={collection.id} checked={isChecked} onChange={() => {}} /></div></div>); })}</div></div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4"><div className="flex-1 text-left"><p className="font-bold text-slate-400">팀전</p><p className="text-xl font-bold">{settings.isTeamMode ? "활성화" : "비활성화"}</p></div><div className="flex-1 text-left"><p className="font-bold text-slate-400">라운드 수</p><p className="text-xl font-bold">{settings.maxRounds} 라운드</p></div></div>
                  <div className="text-left"><p className="font-bold text-slate-400 mb-2">선택된 곡 모음집</p><div className="space-y-2">{getSafeList(settings.songCollections).map(id => allSongCollections.find(c => c.id === id)).filter(Boolean).map(collection => (<div key={collection.id} className="bg-sky-400 text-slate-800 font-bold p-3 rounded-lg">{collection.name}</div>))}</div></div>
                </>
              )}
            </div>
          </div>
          <ActionButtons isMobile={false} isHost={isHost} myPlayer={myPlayer} settings={settings} onCopyLink={handleCopyLink} onStartGame={handleStartGame} onReady={onReady} />
        </div>
      </div>
      <ActionButtons isMobile={true} isHost={isHost} myPlayer={myPlayer} settings={settings} onCopyLink={handleCopyLink} onStartGame={handleStartGame} onReady={onReady} />
    </div>
  );
};

export default LobbyView;