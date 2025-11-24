// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const { 
  googleLogin,
  checkUser,
  checkAdmin,
  getSongs,
  generateTranslation,
  submitRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest
} = adminController;

// 1. 로그인 (Public)
router.post('/google-login', googleLogin);

// 2. 일반 유저 기능 (로그인 필요 - checkUser)
// 노래 목록 조회
router.get('/songs', checkUser, getSongs);
// Gemini 번역 사용
router.post('/generate-translation', checkUser, generateTranslation);
// 수정/삭제/추가 요청 제출
router.post('/request', checkUser, submitRequest);

// 3. 관리자 전용 기능 (관리자 권한 필요 - checkAdmin)
// 대기 중인 요청 목록 확인
router.get('/requests', checkAdmin, getPendingRequests);
// 요청 승인 (DB 반영)
router.post('/requests/:requestId/approve', checkAdmin, approveRequest);
// 요청 거절
router.post('/requests/:requestId/reject', checkAdmin, rejectRequest);

module.exports = router;