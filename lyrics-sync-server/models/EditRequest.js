const mongoose = require('mongoose');

const editRequestSchema = new mongoose.Schema({
  requesterEmail: { type: String, required: true },
  requestType: { type: String, enum: ['create', 'update', 'delete'], required: true },
  targetSongId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
  
  // ⭐ [핵심] Mixed 타입: 내부에 quizzes 배열이든 뭐든 다 저장 가능하게 함
  data: { type: mongoose.Schema.Types.Mixed },
  
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, { strict: false }); // ⭐ strict: false로 설정하여 정의되지 않은 필드도 저장 허용

module.exports = mongoose.model('EditRequest', editRequestSchema);