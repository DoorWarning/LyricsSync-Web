// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const { 
  googleLogin,
  checkAuth,   // ⭐ JWT 검증
  checkAdmin,  // ⭐ 관리자 권한 확인
  getSongs,
  createSong,
  updateSong,
  deleteSong,
  generateTranslation,
  submitRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest
} = adminController;

// 1. 로그인 (Public)
router.post('/google-login', googleLogin);

// 2. 일반 유저 기능 (로그인 필요)
router.get('/songs', checkAuth, getSongs);
router.post('/generate-translation', checkAuth, generateTranslation);
router.post('/request', checkAuth, submitRequest);

// 3. 관리자 전용 기능 (로그인 + 관리자 권한 필요)
router.get('/requests', checkAuth, checkAdmin, getPendingRequests);
router.post('/requests/:requestId/approve', checkAuth, checkAdmin, approveRequest);
router.post('/requests/:requestId/reject', checkAuth, checkAdmin, rejectRequest);

// 관리자 직접 수정 API
router.post('/songs', checkAuth, checkAdmin, createSong);
router.put('/songs/:id', checkAuth, checkAdmin, updateSong);
router.delete('/songs/:id', checkAuth, checkAdmin, deleteSong);

module.exports = router;