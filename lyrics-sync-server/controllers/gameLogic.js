// controllers/gameLogic.js
const Song = require('../models/Song');

const rooms = {};
const roomTimers = {};

// [추가] 라운드 지속 시간 상수 (60초)
const ROUND_DURATION_MS = 60000; 

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function clearRoomTimers(roomName) {
  if (roomTimers[roomName]) {
    Object.values(roomTimers[roomName]).forEach(clearTimeout);
  }
  roomTimers[roomName] = {};
}

// io 객체를 인자로 받아야 함
async function startNewRound(io, roomName) {
  const room = rooms[roomName];
  if (!room) return;

  console.log(`[${roomName}] 방에서 새 라운드를 준비합니다...`);
  clearRoomTimers(roomName);

  if (room.gameState.currentRound >= room.settings.maxRounds) {
    console.log(`[${roomName}] 방 게임 종료! (최대 라운드 도달)`);
    const finalScores = room.settings.isTeamMode ? room.teamScores : room.players;
    io.to(roomName).emit('gameOver', { scores: finalScores, isTeamMode: room.settings.isTeamMode }); 
    room.gameState.currentRound = 0;
    return;
  }
  
  room.gameState.currentRound++;
  
  // [수정] 라운드 종료 시간 계산
  const roundEndTime = Date.now() + ROUND_DURATION_MS;
  room.gameState.roundEndTime = roundEndTime;

  console.log(`[${roomName}] 라운드 ${room.gameState.currentRound} 시작`);

  try {
    if (room.settings.songCollections.length === 0) {
      io.to(roomName).emit('gameError', '선택된 곡 모음집이 없습니다.');
      return;
    }
    
    const randomSong = await Song.aggregate([
      { $match: { collectionNames: { $in: room.settings.songCollections } } },
      { $sample: { size: 1 } }
    ]);

    if (randomSong.length === 0) {
      io.to(roomName).emit('gameError', '선택된 곡 모음집에 노래가 없습니다.');
      return;
    }
    
    const quiz = randomSong[0];
    
    room.gameState.currentAnswer = quiz.title;
    room.gameState.currentOriginalLyrics = quiz.original_lyrics;
    room.gameState.currentTranslatedLyrics = quiz.translated_lyrics;
    room.gameState.currentHint = quiz.hint;
    room.gameState.currentArtistHint = quiz.artist;
    room.gameState.roundStartTime = Date.now();

    console.log(`[${roomName}] 정답: "${quiz.title}"`);
    
    const songCollections = quiz.collectionNames;
    const userCollections = room.settings.songCollections;
    const relevantCollection = songCollections.find(c => userCollections.includes(c)) 
                             || songCollections[0] 
                             || 'Unknown';

    // [수정] roundEndTime 포함하여 전송
    io.to(roomName).emit('newQuiz', { 
      lyrics: quiz.translated_lyrics,
      currentRound: room.gameState.currentRound,
      maxRounds: room.settings.maxRounds,
      collectionName: relevantCollection,
      roundEndTime: roundEndTime 
    }); 

    roomTimers[roomName].hintTimer = setTimeout(() => {
      if (!rooms[roomName]) return; 
      io.to(roomName).emit('showHint', { type: '초성', hint: room.gameState.currentHint });
    }, 30000);

    roomTimers[roomName].artistHintTimer = setTimeout(() => {
      if (!rooms[roomName]) return; 
      io.to(roomName).emit('showHint', { type: '가수', hint: room.gameState.currentArtistHint });
    }, 45000);

    // [수정] 제한 시간을 상수로 관리
    roomTimers[roomName].roundTimer = setTimeout(() => {
      if (!rooms[roomName]) return; 
      io.to(roomName).emit('roundEnd', { 
        answer: room.gameState.currentAnswer,
        artist: room.gameState.currentArtistHint,
        originalLyrics: room.gameState.currentOriginalLyrics,
        translatedLyrics: room.gameState.currentTranslatedLyrics
      });
      
      // 라운드 종료 시 상태 초기화
      room.gameState.currentAnswer = null;
      room.gameState.roundEndTime = null; 
      
      roomTimers[roomName].nextGameTimer = setTimeout(() => {
        if (!rooms[roomName]) return; 
        startNewRound(io, roomName); 
      }, 5000);
    }, ROUND_DURATION_MS);

  } catch (err) {
    console.error('퀴즈 생성 오류:', err);
    io.to(roomName).emit('gameError', '퀴즈를 가져오는 데 실패했습니다.');
  }
}

module.exports = {
  rooms,
  roomTimers,
  generateRoomCode,
  clearRoomTimers,
  startNewRound,
};