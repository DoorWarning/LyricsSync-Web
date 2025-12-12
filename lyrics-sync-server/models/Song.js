// models/Song.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  original_lyrics: { type: String, required: true },
  translated_lyrics: { type: String, required: true },
  hint: String
});

const songSchema = new mongoose.Schema({
  // 1. title은 중복될 수 있으므로 unique: true 제거
  title: { 
    type: String, 
    required: true,
    index: true // 검색 속도를 위해 인덱스는 유지
  },
  artist: { 
    type: String, 
    required: true 
  },
  
  // 2. 이 노래로 만들 수 있는 문제들의 배열
  quizzes: [quizSchema], 
  
  createdAt: { type: Date, default: Date.now }
});

// ⭐ [핵심] 제목과 가수의 '조합'이 유일해야 함 (Compound Index)
// 예: (빅뱅, 거짓말) - OK / (god, 거짓말) - OK / (빅뱅, 거짓말) - 중복 에러
songSchema.index({ title: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('Song', songSchema);