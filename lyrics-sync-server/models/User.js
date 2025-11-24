const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  picture: String,
  role: { 
    type: String, 
    enum: ['admin', 'viewer'], 
    default: 'viewer' // 기본값은 권한 없음
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);