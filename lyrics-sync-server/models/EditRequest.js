const mongoose = require('mongoose');

const editRequestSchema = new mongoose.Schema({
  requesterEmail: String, // 요청한 사람
  requestType: { type: String, enum: ['create', 'update', 'delete'], required: true },
  targetSongId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' }, // 수정/삭제 시 대상 곡 ID
  
  // 요청한 데이터 (새 노래 정보 또는 수정할 정보)
  data: {
    title: String,
    artist: String,
    original_lyrics: String,
    translated_lyrics: String,
    hint: String,
    collectionNames: [String]
  },
  
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EditRequest', editRequestSchema);