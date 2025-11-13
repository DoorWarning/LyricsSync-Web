// src/App.jsx

import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './global.css';

// 1. 뷰 컴포넌트 임포트
import GlobalHeader from './components/GlobalHeader';
import LoginView from './views/LoginView';
import JoinLinkView from './views/JoinLinkView';
import LobbyView from './views/LobbyView';
import GameView from './views/GameView';
import FinalScoreboardPopup from './components/FinalScoreboardPopup';

// 2. 소켓 및 API 설정
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const socket = io(SERVER_URL);

function App() {
  // ----------------------------------------------------------------
  // 3. 모든 상태(State)와 훅(Hook)은 App.jsx에 유지합니다.
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // 4. 모든 useEffect 훅 (이벤트 리스너)도 App.jsx에 유지합니다.
  // ----------------------------------------------------------------
  
  // URL에서 방 코드를 읽어오는 useEffect
  useEffect(() => {
    const path = window.location.pathname;
    if (path.length > 1) {
      const codeFromUrl = path.substring(1).toUpperCase();
      setRoomCode(codeFromUrl);
      setView('joinLink');
    }
  }, []);
  
  // 앱 로드 시 곡 모음집 목록 불러오기
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/api/public/collections`);
        if (response.data.success) {
          const formattedCollections = response.data.collections.map(name => ({ id: name, name: name }));
          setAllSongCollections(formattedCollections);
        }
      } catch (err) {
        console.error("곡 모음집 로딩 실패", err);
        setAllSongCollections([
          { id: "kpop-classics", name: "K-Pop 고전 (로딩 실패)" },
        ]);
      }
    };
    fetchCollections();
  }, []);

  // 메인 소켓 리스너
  useEffect(() => {
    socket.on('error', (message) => alert(message));
    socket.on('updateLobby', (room) => {
      setRoomState(room);
      setRoomCode(room.roomCode);
      setTeamScores(room.teamScores || { 'A': 0, 'B': 0 });
      setView('lobby');
      setMessages([]);
    });
    socket.on('gameStarted', ({ room, autocompleteList }) => {
      setRoomState(room);
      setAutocompleteList(autocompleteList);
      setTeamScores(room.teamScores);
      setView('game');
      setMessages([]);
    });
    socket.on('newQuiz', (quiz) => {
      setQuizLyrics(`[${quiz.collectionName}] (라운드 ${quiz.currentRound}/${quiz.maxRounds})\n${quiz.lyrics}`);
      setMessages([]);
      setRoomState(prev => {
        if (!prev) return null;
        return { ...prev, gameState: { ...prev.gameState, currentRound: quiz.currentRound }};
      });
    });
    socket.on('receiveMessage', (text) => setMessages(prev => [...prev, { type: 'chat', text }]));
    socket.on('showHint', (data) => setMessages(prev => [...prev, { type: 'hint', text: `[${data.type} 힌트] ${data.hint}` }]));
    socket.on('correctAnswer', (data) => {
      const teamPrefix = data.team ? `(${data.team}팀) ` : '';
      setMessages(prev => [...prev, { type: 'answer', text: `🎉 [정답] ${teamPrefix}${data.user} 님이 맞혔습니다! (+${data.scoreGained}점)` }]);
      setMessages(prev => [...prev, { type: 'answer_info', text: `🎵 ${data.artist} - ${data.answer}` }]);
      setMessages(prev => [...prev, { type: 'answer_info', text: `📄 (원곡) ${data.originalLyrics}` }]);
      setMessages(prev => [...prev, { type: 'answer_info', text: `🤔 (문제) ${data.translatedLyrics}` }]);
    });
    socket.on('roundEnd', (data) => {
      setMessages(prev => [...prev, { type: 'answer', text: `⏰ [시간 종료]` }]);
      setMessages(prev => [...prev, { type: 'answer_info', text: `🎵 ${data.artist} - ${data.answer}` }]);
      setMessages(prev => [...prev, { type: 'answer_info', text: `📄 (원곡) ${data.originalLyrics}` }]);
      setMessages(prev => [...prev, { type: 'answer_info', text: `🤔 (문제) ${data.translatedLyrics}` }]);
      setQuizLyrics('');
    });
    socket.on('updatePlayers', (newPlayers) => {
      setRoomState(prev => {
        if (!prev) return prev; 
        return { ...prev, players: newPlayers };
      });
    });
    socket.on('updateTeamScoreboard', (newTeamScores) => {
      setTeamScores(newTeamScores);
    });
    socket.on('gameOver', ({ scores, isTeamMode }) => {
      setMessages(prev => [...prev, { type: 'system', text: `🏁 [게임 종료] 모든 라운드가 끝났습니다! 최종 점수 확인` }]);
      setQuizLyrics('');
      setFinalScoreData({ scores, isTeamMode });
      setShowFinalScoreboard(true); 
      setView('lobby');
      setRoomState(prev => {
        if (!prev) return null;
        const newPlayers = { ...prev.players };
        Object.keys(newPlayers).forEach(id => {
          newPlayers[id].isReady = false;
        });
        return { ...prev, players: newPlayers, gameState: { ...prev.gameState, currentRound: 0 } };
      });
    });

    return () => {
      socket.off('error');
      socket.off('updateLobby');
      socket.off('gameStarted');
      socket.off('newQuiz');
      socket.off('receiveMessage');
      socket.off('showHint');
      socket.off('correctAnswer');
      socket.off('roundEnd');
      socket.off('updatePlayers');
      socket.off('updateTeamScoreboard');
      socket.off('gameOver');
    };
  }, []); // 의존성 배열 비우기 (한 번만 실행)

  // 점수판 정렬 (최상위 유지)
  const sortedScoreboard = useMemo(() => {
    const players = roomState?.players || {}; 
    return Object.entries(players).sort(([, playerA], [, playerB]) => playerB.score - playerA.score);
  }, [roomState?.players]);

  // ----------------------------------------------------------------
  // 5. 모든 핸들러 함수도 App.jsx에 유지합니다.
  // ----------------------------------------------------------------
  
  const handleCreateRoom = () => {
    if (nickname.trim()) socket.emit('createRoom', { nickname });
  };
  const handleJoinRoom = () => {
    if (nickname.trim() && roomCode.trim()) {
      socket.emit('joinRoom', { nickname, roomCode: roomCode.toUpperCase() });
    }
  };
  const handleUpdateSettings = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "songCollections") {
      const currentCollections = roomState.settings.songCollections || [];
      let newCollections;
      if (checked) {
        newCollections = [...currentCollections, value];
      } else {
        newCollections = currentCollections.filter(item => item !== value);
      }
      socket.emit('updateSettings', { songCollections: newCollections });
    } else if (name === "isTeamMode") {
      socket.emit('updateSettings', { isTeamMode: checked });
    } else {
      const isNumeric = ['maxRounds', 'maxPlayers'].includes(name);
      socket.emit('updateSettings', { [name]: isNumeric ? Number(value) : value });
    }
  };
  const handlePlayerReady = () => {
    socket.emit('playerReady');
  };
  const handleStartGame = () => {
    socket.emit('startGame');
  };
  const handleSelectTeam = (team) => {
    socket.emit('selectTeam', { team });
  };
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setCurrentMessage(value);
    if (value.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = autocompleteList
        .filter(title => title.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
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
    setView('login');
    setRoomState(null);
    setRoomCode('');
    window.history.pushState({}, '', '/');
  };
  const copyInviteLink = () => {
    const link = `${window.location.origin}/${roomState.roomCode}`;
    navigator.clipboard.writeText(link)
      .then(() => alert('초대 링크가 복사되었습니다!'))
      .catch(err => console.error('링크 복사 실패', err));
  };

  // ----------------------------------------------------------------
  // 6. 뷰 렌더링 (Switch문 사용)
  // ----------------------------------------------------------------
  
  const renderView = () => {
    switch(view) {
      case 'login':
        return (
          <LoginView
            nickname={nickname}
            setNickname={setNickname}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        );
      case 'joinLink':
        return (
          <JoinLinkView
            nickname={nickname}
            setNickname={setNickname}
            roomCode={roomCode}
            onJoinRoom={handleJoinRoom}
            onGoBack={handleGoToLogin}
          />
        );
      case 'lobby':
        if (!roomState) return <div>로딩 중...</div>; // 로비 데이터가 없을 때
        return (
          <LobbyView
            roomState={roomState}
            myPlayerId={socket.id} // 내 ID 전달
            onGoBack={handleGoToLogin}
            onCopyLink={copyInviteLink}
            onUpdateSettings={handleUpdateSettings}
            onSelectTeam={handleSelectTeam}
            onReady={handlePlayerReady}
            onStartGame={handleStartGame}
            allSongCollections={allSongCollections}
          />
        );
      case 'game':
        if (!roomState) return <div>게임을 불러오는 중...</div>; // 게임 데이터가 없을 때
        return (
          <GameView
            roomState={roomState}
            quizLyrics={quizLyrics}
            messages={messages}
            teamScores={teamScores}
            sortedScoreboard={sortedScoreboard}
            suggestions={suggestions}
            currentMessage={currentMessage}
            onMessageChange={handleMessageChange}
            onSubmitAnswer={submitAnswer}
            onGoBack={handleGoToLogin}
          />
        );
      default:
        return <h2>알 수 없는 뷰: {view}</h2>;
    }
  };

  return (
    <div className="App max-w-7xl mx-auto p-5 text-center">
      {renderView()}
      
      {showFinalScoreboard && (
        <FinalScoreboardPopup 
          data={finalScoreData} 
          onClose={() => setShowFinalScoreboard(false)}
        />
      )}
    </div>
  );
}

export default App;