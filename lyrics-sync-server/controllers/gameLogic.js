// controllers/gameLogic.js
const Song = require('../models/Song');

// ⭐ 모든 방의 상태를 이 파일에서 관리
const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function clearRoomTimers(roomName) {
  if (rooms[roomName] && rooms[roomName].gameTimers) {
    clearTimeout(rooms[roomName].gameTimers.hintTimer);
    clearTimeout(rooms[roomName].gameTimers.artistHintTimer);
    clearTimeout(rooms[roomName].gameTimers.roundTimer);
    clearTimeout(rooms[roomName].gameTimers.nextGameTimer);
    rooms[roomName].gameTimers = {};
  }
}

// ⭐ io 객체를 인자로 받아야 함
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
  console.log(`[${roomName}] 방 라운드 ${room.gameState.currentRound}/${room.settings.maxRounds} 시작`);

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

    console.log(`[${roomName}] 방의 정답이 "${quiz.title}"로 설정되었습니다.`);
    
    const songCollections = quiz.collectionNames;
    const userCollections = room.settings.songCollections;
    const relevantCollection = songCollections.find(c => userCollections.includes(c)) 
                             || songCollections[0] 
                             || 'Unknown';

    io.to(roomName).emit('newQuiz', { 
      lyrics: quiz.translated_lyrics,
      currentRound: room.gameState.currentRound,
      maxRounds: room.settings.maxRounds,
      collectionName: relevantCollection
    }); 

    room.gameTimers.hintTimer = setTimeout(() => {
      io.to(roomName).emit('showHint', { type: '초성', hint: room.gameState.currentHint });
    }, 30000);

    room.gameTimers.artistHintTimer = setTimeout(() => {
      io.to(roomName).emit('showHint', { type: '가수', hint: room.gameState.currentArtistHint });
    }, 45000);

    room.gameTimers.roundTimer = setTimeout(() => {
      io.to(roomName).emit('roundEnd', { 
        answer: room.gameState.currentAnswer,
        artist: room.gameState.currentArtistHint,
        originalLyrics: room.gameState.currentOriginalLyrics,
        translatedLyrics: room.gameState.currentTranslatedLyrics
      });
      room.gameState.currentAnswer = null;
      
      room.gameTimers.nextGameTimer = setTimeout(() => {
        startNewRound(io, roomName); // ⭐ io 전달
      }, 5000);
    }, 60000);

  } catch (err) {
    console.error('퀴즈 생성 오류:', err);
    io.to(roomName).emit('gameError', '퀴즈를 가져오는 데 실패했습니다.');
  }
}

// ⭐ 모듈로 내보내기
module.exports = {
  rooms,
  generateRoomCode,
  clearRoomTimers,
  startNewRound,
};