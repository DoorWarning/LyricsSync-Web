// models/Song.js
const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  original_lyrics: String,
  translated_lyrics: String,
  hint: String,
  collectionNames: [String],
});

module.exports = mongoose.model('Song', songSchema);