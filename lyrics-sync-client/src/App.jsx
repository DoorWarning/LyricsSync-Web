import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './global.css'; 

// Context
import { useSound } from './context/SoundContext';

// Components
import GameDescriptionModal from './components/GameDescriptionModal';

// Views
import LoginView from './views/LoginView';
import JoinLinkView from './views/JoinLinkView';
import LobbyView from './views/LobbyView';
import GameView from './views/GameView';
import FinalScoreboardPopup from './components/FinalScoreboardPopup';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const socket = io(SERVER_URL);

// --- [오디오 미리 로드] 게임 상태 및 타이머 ---
const questionAudio = new Audio('/sounds/question.ogg');
const correctAudio = new Audio('/sounds/correct.ogg');
const incorrectAudio = new Audio('/sounds/incorrect.ogg');
const endAudio = new Audio('/sounds/end.ogg');
const timerAudio = new Audio('/sounds/timer.ogg');
const urgentTimerAudio = new Audio('/sounds/timer2.ogg'); // 10초 이하용

// 볼륨 설정
questionAudio.volume = 0.5;
correctAudio.volume = 0.6;
incorrectAudio.volume = 0.5;
endAudio.volume = 0.6;
timerAudio.volume = 0.3; 
urgentTimerAudio.volume = 0.4;

// Preload
questionAudio.preload = 'auto';
correctAudio.preload = 'auto';
incorrectAudio.preload = 'auto';
endAudio.preload = 'auto';
timerAudio.preload = 'auto';
urgentTimerAudio.preload = 'auto';

function App() {
  const { playSound } = useSound(); // SoundContext 사용
  const [showDescription, setShowDescription] = useState(false)

  const [view, setView] = useState('login'); 
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [allSongCollections, setAllSongCollections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [quizLyrics, setQuizLyrics] = useState('');
  const [autocompleteList, setAutocompleteList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [teamScores, setTeamScores] = useState({ 'A': 0, 'B': 0 });
  const [showFinalScoreboard, setShowFinalScoreboard] = useState(false);
  const [finalScoreData, setFinalScoreData] = useState({ scores: {}, isTeamMode: false });
  
  const [currentHints, setCurrentHints] = useState([]); 
  const [answerPopupData, setAnswerPopupData] = useState(null);

  // 4. 초기 데이터 로딩
  useEffect(() => {
    const path = window.location.pathname;
    if (path.length > 1) {
      const codeFromUrl = path.substring(1).toUpperCase();
      setRoomCode(codeFromUrl);
      setView('joinLink');
    }
    const fetchCollections = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/api/public/collections`);
        if (response.data.success) {
          const formattedCollections = response.data.collections.map(name => ({ id: name, name: name }));
          setAllSongCollections(formattedCollections);
        }
      } catch (err) {
        setAllSongCollections([{ id: "kpop-classics", name: "K-Pop 고전 (로딩 실패)" }]);
      }
    };
    fetchCollections();
  }, []);

  // 5. 소켓 이벤트 리스너
  useEffect(() => {
    const onUpdateLobby = (room) => {
      setRoomState(room);
      setRoomCode(room.roomCode);
      setTeamScores(room.teamScores || { 'A': 0, 'B': 0 });
      if (room.gameState.currentRound === 0) setView('lobby');
    };

    const onGameStarted = ({ room, autocompleteList }) => {
      setRoomState(room);
      setAutocompleteList(autocompleteList);
      setTeamScores(room.teamScores);
      setView('game');
      setMessages([]); 
      setCurrentHints([]); 
      setAnswerPopupData(null);
    };

    const onNewQuiz = (quiz) => {
      playSound(questionAudio); // 문제 출제음
      
      setQuizLyrics(`[${quiz.collectionName}] (라운드 ${quiz.currentRound}/${quiz.maxRounds})\n${quiz.lyrics}`);
      setMessages([]); 
      setCurrentHints([]); 
      setAnswerPopupData(null); 
      setRoomState(prev => {
        if (!prev) return null;
        return { 
            ...prev, 
            gameState: { 
                ...prev.gameState, 
                currentRound: quiz.currentRound,
                roundEndTime: quiz.roundEndTime 
            }
        };
      });
    };

    const onReceiveMessage = (text) => setMessages(prev => [...prev, { type: 'chat', text }]);
    
    const onShowHint = (data) => {
      setCurrentHints(prev => [...prev, data.hint]);
    };
    
    const onCorrectAnswer = (data) => {
      playSound(correctAudio); // 정답음

      setAnswerPopupData({
        type: 'success',
        user: data.user,
        team: data.team,
        scoreGained: data.scoreGained,
        artist: data.artist,
        answer: data.answer,
        originalLyrics: data.originalLyrics,
        translatedLyrics: data.translatedLyrics
      });
      setRoomState(prev => prev ? { ...prev, gameState: { ...prev.gameState, roundEndTime: null }} : null);
    };

    const onRoundEnd = (data) => {
      playSound(incorrectAudio); // 오답/시간초과음

      setAnswerPopupData({
        type: 'fail',
        artist: data.artist,
        answer: data.answer,
        originalLyrics: data.originalLyrics,
        translatedLyrics: data.translatedLyrics
      });
      setQuizLyrics('');
      setRoomState(prev => prev ? { ...prev, gameState: { ...prev.gameState, roundEndTime: null }} : null);
    };

    const onUpdatePlayers = (newPlayers) => setRoomState(prev => (prev ? { ...prev, players: newPlayers } : prev));
    const onUpdateTeamScoreboard = (newTeamScores) => setTeamScores(newTeamScores);

    const onGameOver = ({ scores, isTeamMode }) => {
      playSound(endAudio); // 게임 종료음

      setMessages(prev => [...prev, { type: 'system', text: `🏁 [게임 종료] 게임이 끝났습니다!` }]);
      setQuizLyrics('');
      setFinalScoreData({ scores, isTeamMode });
      setShowFinalScoreboard(true); 
      setAnswerPopupData(null); 
      setView('lobby');
      
      setRoomState(prev => {
        if (!prev) return null;
        const newPlayers = { ...prev.players };
        Object.keys(newPlayers).forEach(id => { newPlayers[id].isReady = false; });
        return { ...prev, players: newPlayers, gameState: { ...prev.gameState, currentRound: 0 } };
      });
    };

    socket.on('updateLobby', onUpdateLobby);
    socket.on('gameStarted', onGameStarted);
    socket.on('newQuiz', onNewQuiz);
    socket.on('receiveMessage', onReceiveMessage);
    socket.on('showHint', onShowHint);
    socket.on('correctAnswer', onCorrectAnswer);
    socket.on('roundEnd', onRoundEnd);
    socket.on('updatePlayers', onUpdatePlayers);
    socket.on('updateTeamScoreboard', onUpdateTeamScoreboard);
    socket.on('gameOver', onGameOver);

    return () => {
      socket.off('updateLobby', onUpdateLobby);
      socket.off('gameStarted', onGameStarted);
      socket.off('newQuiz', onNewQuiz);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('showHint', onShowHint);
      socket.off('correctAnswer', onCorrectAnswer);
      socket.off('roundEnd', onRoundEnd);
      socket.off('updatePlayers', onUpdatePlayers);
      socket.off('updateTeamScoreboard', onUpdateTeamScoreboard);
      socket.off('gameOver', onGameOver);
    };
  }, []);

  const sortedScoreboard = useMemo(() => {
    const players = roomState?.players || {}; 
    return Object.entries(players).sort(([, playerA], [, playerB]) => playerB.score - playerA.score);
  }, [roomState?.players]);

  // 6. 액션 핸들러
  const handleCreateRoom = () => {
    return new Promise((resolve, reject) => {
        if (!nickname.trim()) return reject("닉네임을 입력해주세요.");
        const onUpdate = (room) => { socket.off('error', onError); resolve(room); };
        const onError = (err) => { socket.off('updateLobby', onUpdate); reject(err); };
        socket.once('updateLobby', onUpdate);
        socket.once('error', onError);
        setTimeout(() => { socket.off('updateLobby', onUpdate); socket.off('error', onError); }, 5000);
        socket.emit('createRoom', { nickname });
    });
  };

  const handleJoinRoom = () => {
    return new Promise((resolve, reject) => {
        if (!nickname.trim() || !roomCode.trim()) return reject("닉네임과 방 코드를 입력해주세요.");
        const onUpdate = (room) => { socket.off('error', onError); resolve(room); };
        const onError = (err) => { socket.off('updateLobby', onUpdate); reject(err); };
        socket.once('updateLobby', onUpdate);
        socket.once('error', onError);
        setTimeout(() => { socket.off('updateLobby', onUpdate); socket.off('error', onError); }, 5000);
        socket.emit('joinRoom', { nickname, roomCode: roomCode.toUpperCase() });
    });
  };

  const handleUpdateSettings = (e) => {
    if (!roomState) return;
    const { name, value, checked } = e.target;
    if (name === "songCollections") {
      const currentCollections = roomState.settings.songCollections || [];
      let newCollections = checked ? [...currentCollections, value] : currentCollections.filter(item => item !== value);
      socket.emit('updateSettings', { songCollections: newCollections });
    } else if (name === "isTeamMode") {
      socket.emit('updateSettings', { isTeamMode: checked });
    } else {
      const isNumeric = ['maxRounds', 'maxPlayers'].includes(name);
      socket.emit('updateSettings', { [name]: isNumeric ? Number(value) : value });
    }
  };

  const handlePlayerReady = () => socket.emit('playerReady');
  const handleStartGame = () => socket.emit('startGame');
  const handleSelectTeam = (team) => socket.emit('selectTeam', { team });
  
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setCurrentMessage(value);
    if (value.trim() === '') setSuggestions([]);
    else {
      const filtered = autocompleteList.filter(title => title.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
      setSuggestions(filtered);
    }
  };

  const submitAnswer = (answer) => {
    const answerText = answer || currentMessage; 
    if (answerText.trim() === '') return;
    socket.emit('submitAnswer', { answer: answerText });
    setCurrentMessage('');
    setSuggestions([]);
  };

  const handleGoToLogin = () => {
    if (roomCode) {
        socket.emit('leaveRoom'); // 유령 유저 방지
    }
    setView('login');
    setRoomState(null);
    setRoomCode('');
    setMessages([]);
    setAnswerPopupData(null);
    window.history.pushState({}, '', '/');
  };

  const copyInviteLink = () => {
    if (!roomState) return;
    const link = `${window.location.origin}/${roomState.roomCode}`;
    navigator.clipboard.writeText(link).then(() => alert('초대 링크가 복사되었습니다!')).catch(err => console.error(err));
  };
  
  const renderView = () => {
    const commonProps = {
      onOpenDescription: () => setShowDescription(true)
    };

    switch(view) {
      case 'login': return <LoginView nickname={nickname} setNickname={setNickname} roomCode={roomCode} setRoomCode={setRoomCode} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} {...commonProps}/>;
      case 'joinLink': return <JoinLinkView nickname={nickname} setNickname={setNickname} roomCode={roomCode} onJoinRoom={handleJoinRoom} onGoBack={handleGoToLogin} {...commonProps}/>;
      case 'lobby':
        if (!roomState) return <div>로딩 중...</div>;
        return <LobbyView roomState={roomState} myPlayerId={socket.id} onGoBack={handleGoToLogin} onCopyLink={copyInviteLink} onUpdateSettings={handleUpdateSettings} onSelectTeam={handleSelectTeam} onReady={handlePlayerReady} onStartGame={handleStartGame} allSongCollections={allSongCollections} {...commonProps}/>;
      case 'game':
        if (!roomState) return <div>게임을 불러오는 중...</div>;
        return <GameView roomState={roomState} quizLyrics={quizLyrics} messages={messages} teamScores={teamScores} sortedScoreboard={sortedScoreboard} suggestions={suggestions} currentMessage={currentMessage} onMessageChange={handleMessageChange} onSubmitAnswer={submitAnswer} onGoBack={handleGoToLogin} currentHints={currentHints} answerPopupData={answerPopupData} 
        timerAudio={timerAudio} urgentTimerAudio={urgentTimerAudio} // 타이머 오디오 전달
        {...commonProps}
        />;
      default: return <h2>알 수 없는 뷰: {view}</h2>;
    }
  };

  return (
    <div className="App w-full min-h-screen text-center">
      {renderView()}
      {/* ... 최종 점수 팝업 ... */}
      {showFinalScoreboard && <FinalScoreboardPopup data={finalScoreData} onClose={() => setShowFinalScoreboard(false)} />}
      {/* ⭐ 게임 설명 모달 렌더링 */}
      {showDescription && (
        <GameDescriptionModal onClose={() => setShowDescription(false)} />
      )}
    </div>
  );
}
export default App;