// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

// (GET) 곡 모음집 목록
router.get('/collections', async (req, res) => {
  try {
    const collections = await Song.distinct("collectionNames");
    res.json({ success: true, collections: collections.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ success: false, message: '모음집 로딩 실패: ' + err.message });
  }
});

module.exports = router;