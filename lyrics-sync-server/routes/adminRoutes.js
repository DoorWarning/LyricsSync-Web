// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// authAdmin 미들웨어를 사용하는 경로
const { 
  login, 
  authAdmin, 
  getSongs, 
  createSong, 
  updateSong, 
  deleteSong, 
  generateTranslation 
} = adminController;

// 로그인
router.post('/login', login);

// (이하 모든 경로는 authAdmin 인증 필요)
router.get('/songs', authAdmin, getSongs);
router.post('/songs', authAdmin, createSong);
router.put('/songs/:id', authAdmin, updateSong);
router.delete('/songs/:id', authAdmin, deleteSong);

router.post('/generate-translation', authAdmin, generateTranslation);

module.exports = router;