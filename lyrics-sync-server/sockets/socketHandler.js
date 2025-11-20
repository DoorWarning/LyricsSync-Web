// sockets/socketHandler.js
const { rooms, generateRoomCode, clearRoomTimers, startNewRound } = require('../controllers/gameLogic');
const Song = require('../models/Song');

const TOTAL_AVATARS = 15;
const allAvatarIds = Array.from({ length: TOTAL_AVATARS }, (_, i) => `av_${i + 1}`);

function getAvailableAvatar(room) {
    if (!room) {
        return allAvatarIds[Math.floor(Math.random() * allAvatarIds.length)];
    }
    const usedAvatars = Object.values(room.players).map(p => p.avatar).filter(Boolean);
    if (usedAvatars.length >= allAvatarIds.length) {
        return allAvatarIds[Math.floor(Math.random() * allAvatarIds.length)];
    }
    const availableAvatars = allAvatarIds.filter(id => !usedAvatars.includes(id));
    const randomIndex = Math.floor(Math.random() * availableAvatars.length);
    return availableAvatars[randomIndex];
}

module.exports = function(io) {

  // [수정] 유저 퇴장 처리 로직 공통화 (유령 유저 방지 핵심)
  const handlePlayerExit = (socket) => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players[socket.id];
    if (!player) return;

    console.log(`유저 퇴장 처리: ${player.nickname} (${socket.id})`);

    // 1) 플레이어 삭제
    delete room.players[socket.id];
    
    // [핵심] 소켓을 방 채널에서 확실히 제외시킴
    socket.leave(roomCode);

    // 2) 퇴장 메시지 전송
    io.to(roomCode).emit('receiveMessage', `[알림] ${player.nickname}님이 퇴장했습니다.`);

    const remainingPlayerIds = Object.keys(room.players);

    // 3) 유령 방 방지: 남은 사람이 없으면 즉시 방 삭제
    if (remainingPlayerIds.length === 0) {
      clearRoomTimers(roomCode);
      delete rooms[roomCode];
      console.log(`[${roomCode}] 방이 비어서 삭제되었습니다.`);
      return; 
    }

    // 4) 방장 승계
    if (socket.id === room.hostId) {
      room.hostId = remainingPlayerIds[0];
      const newHost = room.players[room.hostId];
      io.to(roomCode).emit('receiveMessage', `[알림] 방장이 ${newHost.nickname}님으로 변경되었습니다.`);
    }

    // 5) 게임 강제 종료 조건 체크
    if (room.gameState.currentRound > 0) {
      let shouldEndGame = false;
      let endReason = "";

      // 조건 A: 전체 인원이 2명 미만
      if (remainingPlayerIds.length < 2) {
          shouldEndGame = true;
          endReason = "플레이어 수가 부족하여 게임이 종료됩니다.";
      }
      
      // 조건 B: 팀전이고 한쪽 팀 전멸
      if (room.settings.isTeamMode && !shouldEndGame) {
          const teamACount = Object.values(room.players).filter(p => p.team === 'A').length;
          const teamBCount = Object.values(room.players).filter(p => p.team === 'B').length;
          
          if (teamACount === 0 || teamBCount === 0) {
              shouldEndGame = true;
              endReason = "상대 팀원이 모두 퇴장하여 게임이 종료됩니다.";
          }
      }

      // 게임 종료 처리
      if (shouldEndGame) {
          console.log(`[${roomCode}] ${endReason}`);
          io.to(roomCode).emit('receiveMessage', `[알림] ${endReason}`);
          
          const finalScores = room.settings.isTeamMode ? room.teamScores : room.players;
          io.to(roomCode).emit('gameOver', { scores: finalScores, isTeamMode: room.settings.isTeamMode });
          
          // 게임 상태 리셋
          clearRoomTimers(roomCode);
          room.gameState.currentRound = 0;
          room.gameState.currentAnswer = null;
          Object.values(room.players).forEach(p => p.isReady = false);
      }
    }

    // 6) 최종 방 상태 업데이트 전송
    io.to(roomCode).emit('updateLobby', room);
    
    // 소켓 객체에서 방 코드 제거
    socket.roomCode = null;
  };

  io.on('connection', (socket) => {
    console.log(`새로운 유저 접속: ${socket.id}`);

    // 1. 방 생성
    socket.on('createRoom', ({ nickname }) => {
      const roomCode = generateRoomCode();
      socket.join(roomCode);
      
      const assignedAvatar = getAvailableAvatar(null);

      rooms[roomCode] = {
        roomCode: roomCode,
        hostId: socket.id,
        players: {
          [socket.id]: { nickname, score: 0, isReady: false, team: null, avatar: assignedAvatar }
        },
        settings: { 
          maxRounds: 10, 
          songCollections: ["kpop-classics"],
          maxPlayers: 8,
          isTeamMode: false 
        },
        teamScores: { 'A': 0, 'B': 0 },
        gameState: { 
          currentRound: 0, 
          currentAnswer: null,
          currentOriginalLyrics: null,
          currentTranslatedLyrics: null,
          currentHint: null,
          currentArtistHint: null,
          roundStartTime: null,
          roundEndTime: null // [추가] 초기화
        },
        gameTimers: {}
      };

      socket.nickname = nickname;
      socket.roomCode = roomCode;
      socket.emit('updateLobby', rooms[roomCode]);
    });

    // 2. 방 참가 (기존 동일)
    socket.on('joinRoom', ({ roomCode, nickname }) => {
      const room = rooms[roomCode];
      if (!room) {
        return socket.emit('error', '존재하지 않는 방입니다.');
      }
      const nicknameExists = Object.values(room.players).some(p => p.nickname === nickname);
      if (nicknameExists) {
        return socket.emit('error', '이미 사용 중인 닉네임입니다.');
      }
      const currentPlayers = Object.keys(room.players).length;
      if (currentPlayers >= room.settings.maxPlayers) {
        return socket.emit('error', '방이 가득 찼습니다.');
      }

      socket.join(roomCode);
      socket.nickname = nickname;
      socket.roomCode = roomCode;

      const assignedAvatar = getAvailableAvatar(room);
      room.players[socket.id] = { nickname, score: 0, isReady: false, team: null, avatar: assignedAvatar }; 
      io.to(roomCode).emit('updateLobby', room);
    });

    // 3. 팀 선택, 4. 설정 변경, 5. 준비 완료, 6. 게임 시작 (기존 동일)
    socket.on('selectTeam', ({ team }) => {
      const room = rooms[socket.roomCode];
      const player = room?.players[socket.id];
      if (!room || !player || !['A', 'B'].includes(team)) return;
      const teamCount = Object.values(room.players).filter(p => p.team === team).length;
      const maxPerTeam = Math.ceil(room.settings.maxPlayers / 2);
      if (teamCount >= maxPerTeam) return socket.emit('error', `${team}팀이 가득 찼습니다.`);
      player.team = team;
      player.isReady = false; 
      io.to(socket.roomCode).emit('updateLobby', room);
    });

    socket.on('updateSettings', (newSettings) => {
      const room = rooms[socket.roomCode];
      if (room && room.hostId === socket.id) {
        if (newSettings.isTeamMode !== undefined) {
          room.settings.isTeamMode = newSettings.isTeamMode;
          Object.values(room.players).forEach(p => { p.team = null; p.isReady = false; });
        }
        if (newSettings.songCollections) room.settings.songCollections = newSettings.songCollections;
        else room.settings = { ...room.settings, ...newSettings };
        io.to(socket.roomCode).emit('updateLobby', room);
      }
    });

    socket.on('playerReady', () => {
      const room = rooms[socket.roomCode];
      const player = room?.players[socket.id];
      if (!room || !player) return;
      if (room.settings.isTeamMode && !player.team) return socket.emit('error', '먼저 팀을 선택해야 합니다.');
      player.isReady = !player.isReady;
      io.to(socket.roomCode).emit('updateLobby', room);
    });

    socket.on('startGame', async () => {
      const room = rooms[socket.roomCode];
      if (room && room.hostId === socket.id) {
        const allReady = Object.values(room.players).every(p => p.isReady || p === room.players[room.hostId]);
        if (!allReady) return socket.emit('error', '아직 준비되지 않은 유저가 있습니다.');
        if (room.settings.songCollections.length === 0) return socket.emit('error', '곡 모음집을 선택해주세요.');
        if (room.settings.isTeamMode) {
          const teamACount = Object.values(room.players).filter(p => p.team === 'A').length;
          const teamBCount = Object.values(room.players).filter(p => p.team === 'B').length;
          if (teamACount === 0 || teamBCount === 0) return socket.emit('error', '양 팀에 최소 1명 필요합니다.');
        }
        room.gameState.currentRound = 0;
        Object.values(room.players).forEach(p => p.score = 0);
        room.teamScores = { 'A': 0, 'B': 0 };
        const songTitles = await Song.find().select('title');
        io.to(socket.roomCode).emit('gameStarted', { room, autocompleteList: songTitles.map(s => s.title) });
        setTimeout(() => { startNewRound(io, socket.roomCode); }, 1000);
      }
    });

    // 7. 정답 제출
    socket.on('submitAnswer', ({ answer }) => {
      const roomCode = socket.roomCode;
      const room = rooms[roomCode];
      const player = room?.players[socket.id];
      if (!room || !player || !room.gameState.currentAnswer) return;

      const correctAnswer = room.gameState.currentAnswer;

      if (answer.trim() === correctAnswer) {
        clearRoomTimers(roomCode);
        const timeElapsed = Date.now() - room.gameState.roundStartTime;
        let scoreGained = 0;
        if (timeElapsed < 30000) scoreGained = 30;
        else if (timeElapsed < 45000) scoreGained = 20;
        else scoreGained = 10;
        
        if (room.settings.isTeamMode) room.teamScores[player.team] += scoreGained;
        else player.score += scoreGained;
        
        room.gameState.currentAnswer = null;

        io.to(roomCode).emit('correctAnswer', {
          user: player.nickname,
          team: player.team,
          answer: correctAnswer,
          artist: room.gameState.currentArtistHint,
          originalLyrics: room.gameState.currentOriginalLyrics,
          translatedLyrics: room.gameState.currentTranslatedLyrics,
          scoreGained
        });
        
        if (room.settings.isTeamMode) io.to(roomCode).emit('updateTeamScoreboard', room.teamScores);
        else io.to(roomCode).emit('updatePlayers', room.players);

        room.gameTimers.nextGameTimer = setTimeout(() => { startNewRound(io, roomCode); }, 5000);

      } else {
        const msg = room.settings.isTeamMode 
          ? `[${player.team}팀] ${player.nickname}: ${answer}` 
          : `[${player.nickname}]: ${answer}`;
        io.to(roomCode).emit('receiveMessage', msg);
      }
    });

    // [추가] 8. 명시적 퇴장 (나가기 버튼)
    socket.on('leaveRoom', () => {
      handlePlayerExit(socket);
    });

    // [수정] 9. 연결 해제 (브라우저 종료 등)
    socket.on('disconnect', () => {
      console.log(`유저 접속 해제: ${socket.id}`);
      handlePlayerExit(socket);
    });
  });
};