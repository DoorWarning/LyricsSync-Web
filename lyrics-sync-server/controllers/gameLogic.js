// controllers/gameLogic.js
const mongoose = require('mongoose'); // [추가] ID 유효성 검사 목적
const Song = require('../models/Song');
const PlayList = require('../models/PlayList');

const rooms = {};
const roomTimers = {};

// 라운드 지속 시간 상수 (60초)
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
  
  // 라운드 종료 시간 계산
  const roundEndTime = Date.now() + ROUND_DURATION_MS;
  room.gameState.roundEndTime = roundEndTime;

  console.log(`[${roomName}] 라운드 ${room.gameState.currentRound} 시작`);

  try {
    const selectedInputs = room.settings.songCollections; // 예: ['64abc...', 'kpop-classics']

    if (!selectedInputs || selectedInputs.length === 0) {
      io.to(roomName).emit('gameError', '선택된 곡 모음집이 없습니다.');
      return;
    }
    
    // ⭐ [핵심 수정] ID와 이름을 구분하여 안전하게 검색
    const targetIds = [];
    const targetNames = [];

    selectedInputs.forEach(input => {
        // MongoDB ID 형식(24자리 Hex)인지 확인
        if (mongoose.Types.ObjectId.isValid(input) && String(input).length === 24) {
            targetIds.push(input);
        } else {
            // 아니면 이름으로 간주
            targetNames.push(input);
        }
    });

    // ID로 찾거나 OR 이름으로 찾기
    const playlists = await PlayList.find({
        $or: [
            { _id: { $in: targetIds } },
            { name: { $in: targetNames } }
        ]
    });
    
    // 가져온 플레이리스트들에서 노래 ID 추출
    let allSongIds = [];
    playlists.forEach(pl => {
        allSongIds = [...allSongIds, ...pl.songs];
    });
    
    // 중복 제거
    const uniqueSongIds = [...new Set(allSongIds.map(id => id.toString()))];

    if (uniqueSongIds.length === 0) {
      console.log(`[${roomName}] 에러: 선택된 모음집(${selectedInputs})에 노래가 없음.`);
      io.to(roomName).emit('gameError', '선택된 모음집에 노래가 없습니다.');
      return;
    }

    // 2. 랜덤하게 노래 하나 선택
    const randomIndex = Math.floor(Math.random() * uniqueSongIds.length);
    const randomSongId = uniqueSongIds[randomIndex];
    
    const song = await Song.findById(randomSongId);

    if (!song || !song.quizzes || song.quizzes.length === 0) {
        console.error(`노래 데이터 오류: ${randomSongId}`);
        io.to(roomName).emit('gameError', '문제 생성 중 오류가 발생했습니다.');
        return;
    }

    // 3. 해당 노래의 퀴즈 중 하나를 랜덤 선택
    const randomQuiz = song.quizzes[Math.floor(Math.random() * song.quizzes.length)];
    
    // 4. 게임 상태 업데이트
    room.gameState.currentAnswer = song.title;
    room.gameState.currentArtistHint = song.artist;
    room.gameState.currentOriginalLyrics = randomQuiz.original_lyrics;
    room.gameState.currentTranslatedLyrics = randomQuiz.translated_lyrics;
    room.gameState.currentHint = randomQuiz.hint;
    room.gameState.roundStartTime = Date.now();

    console.log(`[${roomName}] 정답: "${song.title}"`);
    
    // 화면 표시용 모음집 이름 찾기
    const currentCollectionObj = playlists.find(pl => 
        pl.songs.some(id => id.toString() === randomSongId)
    );
    const collectionDisplayName = currentCollectionObj ? currentCollectionObj.name : '알 수 없음';

    // 클라이언트로 퀴즈 전송
    io.to(roomName).emit('newQuiz', { 
      lyrics: randomQuiz.translated_lyrics,
      currentRound: room.gameState.currentRound,
      maxRounds: room.settings.maxRounds,
      collectionName: collectionDisplayName,
      roundEndTime: roundEndTime 
    }); 

    // 타이머 설정
    roomTimers[roomName].hintTimer = setTimeout(() => {
      if (!rooms[roomName]) return; 
      io.to(roomName).emit('showHint', { type: '초성', hint: room.gameState.currentHint });
    }, 30000);

    roomTimers[roomName].artistHintTimer = setTimeout(() => {
      if (!rooms[roomName]) return; 
      io.to(roomName).emit('showHint', { type: '가수', hint: room.gameState.currentArtistHint });
    }, 45000);

    roomTimers[roomName].roundTimer = setTimeout(() => {
      if (!rooms[roomName]) return; 
      io.to(roomName).emit('roundEnd', { 
        answer: room.gameState.currentAnswer,
        artist: room.gameState.currentArtistHint,
        originalLyrics: room.gameState.currentOriginalLyrics,
        translatedLyrics: room.gameState.currentTranslatedLyrics
      });
      
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