const express = require('express');
const router = express.Router();
const PlayList = require('../models/PlayList'); // [변경] PlayList 모델 참조

// GET /api/public/collections
// 게임 로비에서 선택 가능한 '모음집 목록'을 반환
router.get('/collections', async (req, res) => {
  try {
    // PlayList 컬렉션에서 모든 문서의 'name'과 'description' 필드만 가져옵니다.
    const collections = await PlayList.find({}, 'name description');
    
    // 프론트엔드에서 사용하기 편하게 반환
    res.json({ success: true, collections });
  } catch (err) {
    console.error('컬렉션 조회 실패:', err);
    res.status(500).json({ success: false, message: '모음집 목록을 불러오지 못했습니다.' });
  }
});

module.exports = router;