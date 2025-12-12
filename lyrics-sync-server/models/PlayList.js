// models/PlayList.js
const mongoose = require('mongoose');

const playListSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // 예: 'kpop-2023'
  description: String,
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }] // Song 참조
});

module.exports = mongoose.model('PlayList', playListSchema);