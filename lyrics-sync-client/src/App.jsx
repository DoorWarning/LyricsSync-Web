// src/App.jsx

import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import axios from 'axios'; // API 통신용
import './App.css'; 

// 1. 소켓 연결 (환경 변수 사용)
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const socket = io(SERVER_URL);

// 글로벌 헤더
const GlobalHeader = ({ onBack }) => (
  <header className="lobby-header">
    <button className="btn-secondary" onClick={onBack}>뒤로</button>
    <h2>LyricsSync</h2>
    <div style={{ width: '60px' }}></div>
  </header>
);

function App() {
  // 뷰 관리
  const [view, setView] = useState('login'); 
  
  // 로그인/방 입장용 상태
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // 방 전체의 상태
  const [roomState, setRoomState] = useState(null);
  
  // DB에서 가져올 곡 모음집 목록
  const [allSongCollections, setAllSongCollections] = useState([]);
  
  // 게임 화면용 상태
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [quizLyrics, setQuizLyrics] = useState('');
  
  // 자동완성용 상태
  const [autocompleteList, setAutocompleteList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // 팀 점수판 상태
  const [teamScores, setTeamScores] = useState({ 'A': 0, 'B': 0 });
  
  // 최종 점수판 팝업 상태
  const [showFinalScoreboard, setShowFinalScoreboard] = useState(false);
  const [finalScoreData, setFinalScoreData] = useState({ scores: {}, isTeamMode: false });


  // ----------------------------------------------------------------
  // 2. 소켓 이벤트 리스너
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
        // 환경 변수 사용
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
  }, []); // 앱 로드 시 한 번만 실행

  // 메인 소켓 리스너
  useEffect(() => {
    socket.on('error', (message) => {
      alert(message);
    });
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
  }, []);

  const sortedScoreboard = useMemo(() => {
    const players = roomState?.players || {}; 
    return Object.entries(players).sort(([, playerA], [, playerB]) => playerB.score - playerA.score);
  }, [roomState?.players]);

  // ----------------------------------------------------------------
  // 3. 소켓 이벤트 발신 (핸들러 함수)
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
  // 4. 뷰 렌더링
  // ----------------------------------------------------------------

  // [뷰 1] 로그인 화면
  const renderLogin = () => (
    <div className="login-view">
      <div className="login-logo">
        <h1>Lyrics<span>Sync</span></h1>
        <p>WEIRD TRANSLATION LYRICS QUIZ</p>
      </div>
      <div className="login-panel panel">
        <div className="login-group">
          <label htmlFor="nickname-input">닉네임</label>
          <input
            id="nickname-input"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="사용할 닉네임"
          />
        </div>
        <hr />
        <div className="login-group">
          <h3>방 만들기</h3>
          <button onClick={handleCreateRoom} disabled={!nickname.trim()} className="btn-primary">
            새 방 만들기
          </button>
        </div>
        <hr />
        <div className="login-group">
          <h3>방 참가하기</h3>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="참여 코드 (4자리)"
            maxLength={4}
          />
          <button onClick={handleJoinRoom} disabled={!nickname.trim() || !roomCode.trim()} className="btn-blue">
            참가
          </button>
        </div>
      </div>
    </div>
  );

  // [뷰 1.5] 링크 참가 화면
  const renderJoinLink = () => (
    <div className="login-view">
      <div className="login-logo">
        <h1>Lyrics<span>Sync</span></h1>
        <p>WEIRD TRANSLATION LYRICS QUIZ</p>
      </div>
      <div className="login-panel panel">
        <h2>방 참가</h2>
        <p style={{ color: 'var(--accent-blue)', fontSize: '1.2em' }}>
          방 코드: <strong>{roomCode}</strong>
        </p>
        <div className="login-group">
          <label htmlFor="nickname-input">닉네임</label>
          <input
            id="nickname-input"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="사용할 닉네임"
          />
        </div>
        <div className="login-group">
          <button onClick={handleJoinRoom} disabled={!nickname.trim()} className="btn-primary">
            참가하기
          </button>
          <button onClick={handleGoToLogin} className="btn-secondary">
            취소
          </button>
        </div>
      </div>
    </div>
  );

  // [뷰 2] 대기실 (로비) 화면
  const renderLobby = () => {
    if (!roomState) return <div>로딩 중...</div>;
    
    const { hostId, players, settings, roomCode } = roomState;
    const isHost = socket.id === hostId;
    const myPlayer = players[socket.id];
    
    const teamA = Object.entries(players).filter(([, p]) => p.team === 'A');
    const teamB = Object.entries(players).filter(([, p]) => p.team === 'B');
    const noTeam = Object.entries(players).filter(([, p]) => p.team === null);

    return (
      <div className="lobby-view">
        <GlobalHeader onBack={handleGoToLogin} />
        
        <h2 style={{ color: 'var(--secondary-text)' }}>
          방 코드: <span className="room-code">{roomCode}</span>
        </h2>

        <div className="lobby-container view-container">
          <div className="player-list panel">
            <h3>플레이어 ({Object.keys(players).length}/{settings.maxPlayers})</h3>
            
            {settings.isTeamMode ? (
              // --- 팀전 뷰 ---
              <div className="team-view">
                <div className="team-panel" data-team="A">
                  <h4>A팀 ({teamA.length})</h4>
                  {myPlayer?.team !== 'A' && (
                    <button onClick={() => handleSelectTeam('A')} className="btn-blue">A팀 참가</button>
                  )}
                  <ul>
                    {teamA.map(([id, player]) => (
                      <li key={id}>
                        {player.nickname} {id === hostId ? '👑' : ''}
                        <span style={{ color: player.isReady ? '#4CAF50' : '#888' }}>
                          {player.isReady ? ' (R)' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="team-panel" data-team="B">
                  <h4>B팀 ({teamB.length})</h4>
                  {myPlayer?.team !== 'B' && (
                    <button onClick={() => handleSelectTeam('B')} className="btn-blue">B팀 참가</button>
                  )}
                  <ul>
                    {teamB.map(([id, player]) => (
                      <li key={id}>
                        {player.nickname} {id === hostId ? '👑' : ''}
                        <span style={{ color: player.isReady ? '#4CAF50' : '#888' }}>
                          {player.isReady ? ' (R)' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              // --- 개인전 뷰 ---
              <ul>
                {noTeam.map(([id, player]) => (
                  <li key={id}>
                    {player.nickname} {id === hostId ? '👑' : ''}
                    <span style={{ color: player.isReady ? '#4CAF50' : '#888' }}>
                      {player.isReady ? ' (준비완료)' : ' (대기중)'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="room-settings panel">
            <h3>게임 설정 {isHost ? '' : '(현재 설정)'}</h3>
            
            <div className="settings-group">
              <label>
                <input
                  type="checkbox"
                  name="isTeamMode"
                  checked={settings.isTeamMode}
                  onChange={handleUpdateSettings}
                  disabled={!isHost}
                />
                팀전
              </label>
            </div>

            <div className="settings-group">
              <label>최대 인원</label>
              {isHost ? (
                <select name="maxPlayers" value={settings.maxPlayers} onChange={handleUpdateSettings}>
                  <option value={4}>4명</option>
                  <option value={6}>6명</option>
                  <option value={8}>8명</option>
                  <option value={10}>10명</option>
                </select>
              ) : (
                <strong>{settings.maxPlayers}명</strong>
              )}
            </div>
            
            <div className="settings-group">
              <label>라운드 수</label>
              {isHost ? (
                <select name="maxRounds" value={settings.maxRounds} onChange={handleUpdateSettings}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              ) : (
                <strong>{settings.maxRounds}</strong>
              )}
            </div>
            
            <div className="settings-group checkbox-group">
              <label>곡 모음집 목록</label>
                {allSongCollections.map(collection => (
                  <div className="collection-item" key={collection.id}>
                    <span>{collection.name}</span>
                    <input
                      type="checkbox"
                      name="songCollections"
                      value={collection.id}
                      checked={settings.songCollections.includes(collection.id)}
                      onChange={handleUpdateSettings}
                      disabled={!isHost}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="lobby-footer">
          <button onClick={copyInviteLink} className="btn-blue" style={{ height: '50px' }}>
            초대 링크 복사
          </button>
          
          {!isHost && myPlayer && (
            <button 
              onClick={handlePlayerReady} 
              className={myPlayer.isReady ? "btn-secondary" : "btn-blue"}
              style={{ height: '50px' }}
              disabled={settings.isTeamMode && !myPlayer.team}
            >
              {myPlayer.isReady ? '준비 취소' : (settings.isTeamMode && !myPlayer.team ? '팀을 선택하세요' : '준비 완료')}
            </button>
          )}
          {isHost && (
            <button onClick={handleStartGame} className="btn-primary" style={{ height: '50px' }}>
              시작
            </button>
          )}
        </div>
      </div>
    );
  };

  // [뷰 3] 게임 화면
  const renderGame = () => {
    if (!roomState) return <div>게임을 불러오는 중...</div>;

    const { settings } = roomState;

    return (
      <div className="game-view">
        <GlobalHeader onBack={handleGoToLogin} />
        
        <div className="game-container view-container">
          
          <div className="game-sidebar">
            <div className="scoreboard panel">
              <h3>점수판</h3>
              {settings.isTeamMode ? (
                <ul>
                  <li data-team="A">A팀: {teamScores.A}점</li>
                  <li data-team="B">B팀: {teamScores.B}점</li>
                </ul>
              ) : (
                <ul>
                  {sortedScoreboard.map(([id, player]) => (
                    <li key={id}>
                      <span>{player.nickname}</span>
                      <span>{player.score}점</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="game-main">
            <div className="quiz-area panel">
              <h3>문제</h3>
              {quizLyrics || "다음 라운드를 기다리는 중..."}
            </div>
            
            <div className="chat-window panel">
              <h3>채팅 로그</h3>
              {messages.map((msg, index) => (
                <div key={index} className={`message type-${msg.type}`}>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

        </div>
        
        <div className="input-area">
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((title) => (
                <li key={title} onMouseDown={() => submitAnswer(title)}>
                  {title}
                </li>
              ))}
            </ul>
          )}
          <input
            type="text"
            placeholder={quizLyrics ? "채팅 및 정답 입력창" : "대기 중..."}
            value={currentMessage}
            onChange={handleMessageChange}
            onKeyPress={(e) => e.key === 'Enter' && submitAnswer(null)}
            onBlur={() => setTimeout(() => setSuggestions([]), 100)}
            onFocus={handleMessageChange}
            disabled={!quizLyrics}
          />
          <button onClick={() => submitAnswer(null)} disabled={!quizLyrics} className="btn-primary">
            입력
          </button>
        </div>
      </div>
    );
  };
  
  // 최종 점수판 팝업 렌더링
  const renderFinalScoreboard = () => {
    const { scores, isTeamMode } = finalScoreData;
    let sortedScores;

    if (isTeamMode) {
      sortedScores = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
    } else {
      sortedScores = Object.entries(scores).sort(([, playerA], [, playerB]) => playerB.score - playerA.score);
    }

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>🏆 최종 점수</h2>
          <ul>
            {isTeamMode ? (
              sortedScores.map(([team, score]) => (
                <li key={team} data-team={team}>
                  {team}팀: {score}점
                </li>
              ))
            ) : (
              sortedScores.map(([id, player]) => (
                <li key={id}>{player.nickname}: {player.score}점</li>
              ))
            )}
          </ul>
          <button onClick={() => setShowFinalScoreboard(false)} className="btn">닫기</button>
        </div>
      </div>
    );
  };

  // 메인 렌더링
  return (
    <div className="App">
      {/* 뷰에 따라 다른 컴포넌트 렌더링 */}
      {view === 'login' && renderLogin()}
      {view === 'joinLink' && renderJoinLink()}
      {view === 'lobby' && renderLobby()}
      {view === 'game' && renderGame()}
      
      {/* 팝업은 뷰와 상관없이 렌더링 */}
      {showFinalScoreboard && renderFinalScoreboard()}
    </div>
  );
}

export default App;