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

  io.on('connection', (socket) => {
    console.log(`새로운 유저 접속: ${socket.id}`);

    // 'createRoom' 이벤트
    socket.on('createRoom', ({ nickname }) => {
      const roomCode = generateRoomCode();
      socket.join(roomCode);
      
      const assignedAvatar = getAvailableAvatar(null); // 방 생성 시에는 랜덤 아바타

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
          roundStartTime: null
        },
        gameTimers: {}
      };

      socket.nickname = nickname;
      socket.roomCode = roomCode;
      socket.emit('updateLobby', rooms[roomCode]);
    });

    // 'joinRoom' 이벤트
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

    // 'selectTeam' 이벤트
    socket.on('selectTeam', ({ team }) => {
      const room = rooms[socket.roomCode];
      const player = room?.players[socket.id];
      
      if (!room || !player || !['A', 'B'].includes(team)) return;

      const teamCount = Object.values(room.players).filter(p => p.team === team).length;
      const maxPerTeam = Math.ceil(room.settings.maxPlayers / 2);
      
      if (teamCount >= maxPerTeam) {
        return socket.emit('error', `${team}팀이 가득 찼습니다. (최대 ${maxPerTeam}명)`);
      }

      player.team = team;
      player.isReady = false; 

      io.to(socket.roomCode).emit('updateLobby', room);
    });

    // 'updateSettings' 이벤트
    socket.on('updateSettings', (newSettings) => {
      const room = rooms[socket.roomCode];
      if (room && room.hostId === socket.id) {
        
        if (newSettings.isTeamMode !== undefined) {
          room.settings.isTeamMode = newSettings.isTeamMode;
          Object.values(room.players).forEach(p => {
            p.team = null;
            p.isReady = false;
          });
        }
        
        if (newSettings.songCollections) {
          room.settings.songCollections = newSettings.songCollections;
        } else {
          room.settings = { ...room.settings, ...newSettings };
        }
        io.to(socket.roomCode).emit('updateLobby', room);
      }
    });

    // 'playerReady' 이벤트
    socket.on('playerReady', () => {
      const room = rooms[socket.roomCode];
      const player = room?.players[socket.id];
      if (!room || !player) return;

      if (room.settings.isTeamMode && !player.team) {
        return socket.emit('error', '먼저 팀을 선택해야 합니다.');
      }

      player.isReady = !player.isReady;
      io.to(socket.roomCode).emit('updateLobby', room);
    });

    // 'startGame' 이벤트
    socket.on('startGame', async () => {
      const room = rooms[socket.roomCode];
      if (room && room.hostId === socket.id) {
        const allReady = Object.values(room.players).every(p => p.isReady || p === room.players[room.hostId]);
        if (!allReady) {
          return socket.emit('error', '아직 준비되지 않은 유저가 있습니다.');
        }
        
        if (room.settings.songCollections.length === 0) {
          return socket.emit('error', '적어도 하나 이상의 곡 모음집을 선택해야 합니다.');
        }
        
        if (room.settings.isTeamMode) {
          const teamACount = Object.values(room.players).filter(p => p.team === 'A').length;
          const teamBCount = Object.values(room.players).filter(p => p.team === 'B').length;
          if (teamACount === 0 || teamBCount === 0) {
            return socket.emit('error', '팀전은 양 팀에 최소 1명 이상의 플레이어가 필요합니다.');
          }
        }
        
        room.gameState.currentRound = 0;
        Object.values(room.players).forEach(p => p.score = 0);
        room.teamScores = { 'A': 0, 'B': 0 };
        
        const songTitles = await Song.find().select('title');
        
        io.to(socket.roomCode).emit('gameStarted', { 
          room, 
          autocompleteList: songTitles.map(s => s.title)
        });
        
        setTimeout(() => {
          startNewRound(io, socket.roomCode); // ⭐ io 전달
        }, 1000);
      }
    });

    // 'submitAnswer' 이벤트
    socket.on('submitAnswer', ({ answer }) => {
      const roomCode = socket.roomCode;
      const room = rooms[roomCode];
      const player = room?.players[socket.id];
      
      if (!room || !player || !room.gameState.currentAnswer) return;

      const correctAnswer = room.gameState.currentAnswer;

      if (answer.trim() === correctAnswer) {
        console.log(`[${roomCode}] 방 ${player.nickname} 유저 정답!`);
        clearRoomTimers(roomCode);

        const timeElapsed = Date.now() - room.gameState.roundStartTime;
        let scoreGained = 0;
        if (timeElapsed < 30000) scoreGained = 30;
        else if (timeElapsed < 45000) scoreGained = 20;
        else scoreGained = 10;
        
        if (room.settings.isTeamMode) {
          const playerTeam = player.team;
          room.teamScores[playerTeam] += scoreGained;
        } else {
          player.score += scoreGained;
        }
        
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
        
        if (room.settings.isTeamMode) {
          io.to(roomCode).emit('updateTeamScoreboard', room.teamScores);
        } else {
          io.to(roomCode).emit('updatePlayers', room.players);
        }

        room.gameTimers.nextGameTimer = setTimeout(() => {
          startNewRound(io, roomCode); // ⭐ io 전달
        }, 5000);

      } else {
        if (room.settings.isTeamMode) {
          io.to(roomCode).emit('receiveMessage', `[${player.team}팀] ${player.nickname}: ${answer}`);
        } else {
          io.to(roomCode).emit('receiveMessage', `[${player.nickname}]: ${answer}`);
        }
      }
    });

    // 'disconnect' 이벤트
    socket.on('disconnect', () => {
      console.log(`유저 접속 해제: ${socket.id}`);
      
      const roomCode = socket.roomCode;
      const room = rooms[roomCode];
      if (!room) return;

      const player = room.players[socket.id];
      if (!player) return;

      // 1. 플레이어 삭제 (메모리 상에서만)
      delete room.players[socket.id];
      
      // 2. 퇴장 메시지 전송
      io.to(roomCode).emit('receiveMessage', `[알림] ${player.nickname}님이 퇴장했습니다.`);

      // 3. 방장 승계 로직 (방장인 경우에만)
      if (socket.id === room.hostId) {
        const remainingPlayers = Object.keys(room.players);
        
        if (remainingPlayers.length > 0) {
          // 다음 사람에게 방장 위임
          room.hostId = remainingPlayers[0];
          const newHost = room.players[room.hostId];
          io.to(roomCode).emit('receiveMessage', `[알림] 방장이 ${newHost.nickname}님으로 변경되었습니다.`);
        } else {
          // 남은 사람이 없으면 방 삭제
          clearRoomTimers(roomCode);
          delete rooms[roomCode];
          console.log(`[${roomCode}] 방이 비어서 삭제되었습니다.`);
          return; // 방이 사라졌으니 업데이트 전송 중단
        }
      }

      // 4. [중요] 모든 처리가 끝난 최종 방 정보를 "한 번만" 전송
      io.to(roomCode).emit('updateLobby', room);
    });
  });
};