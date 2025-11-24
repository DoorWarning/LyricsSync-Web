// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const { 
  googleLogin,
  checkAuth, // ⭐ [수정] JWT 검증 미들웨어
  checkAdmin, // 관리자 권한 확인 미들웨어
  getSongs,
  generateTranslation,
  submitRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  handleWebhook
} = adminController;

// 1. 로그인 (Public)
router.post('/google-login', googleLogin);

// 2. GitHub Webhook (Public)
router.post('/webhook/github', handleWebhook); 

// --- 3. 로그인된 유저 (checkAuth) 필요 기능 ---

// 노래 목록 조회 (모든 로그인 유저)
router.get('/songs', checkAuth, getSongs); 
// Gemini 번역 사용 (모든 로그인 유저)
router.post('/generate-translation', checkAuth, generateTranslation);
// 수정/삭제/추가 요청 제출 (모든 로그인 유저)
router.post('/request', checkAuth, submitRequest);


// --- 4. 관리자 전용 (checkAuth + checkAdmin) 필요 기능 ---

// 대기 중인 요청 목록 확인
router.get('/requests', checkAuth, checkAdmin, getPendingRequests);
// 요청 승인 (DB 반영)
router.post('/requests/:requestId/approve', checkAuth, checkAdmin, approveRequest);
// 요청 거절
router.post('/requests/:requestId/reject', checkAuth, checkAdmin, rejectRequest);

module.exports = router;