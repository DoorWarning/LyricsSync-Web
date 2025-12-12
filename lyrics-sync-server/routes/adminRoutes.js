const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. 로그인 (인증 불필요)
router.post('/google-login', adminController.googleLogin);

// 2. Webhook (GitHub 배포용, 인증 불필요)
router.post('/webhook', adminController.handleWebhook);

// -----------------------------------------------------------
// 아래부터는 로그인(Token) 필요
// -----------------------------------------------------------

// 3. 노래 목록 조회 (모든 로그인 유저)
router.get('/songs', adminController.checkAuth, adminController.getSongs);

// 4. AI 번역 생성 (모든 로그인 유저 - QuizMaker 등에서 사용)
router.post('/generate-translation', adminController.checkAuth, adminController.generateTranslation);

// 5. 수정/추가 요청 보내기 (일반 유저용)
router.post('/request', adminController.checkAuth, adminController.submitRequest);

// -----------------------------------------------------------
// 관리자(Admin) 전용 기능
// -----------------------------------------------------------

// 6. 요청 목록 조회 (관리자만)
router.get('/requests', 
    adminController.checkAuth, 
    adminController.checkAdmin, 
    adminController.getPendingRequests
);

// 7. 요청 승인 (관리자만)
router.post('/requests/:requestId/approve', 
    adminController.checkAuth, 
    adminController.checkAdmin, 
    adminController.approveRequest
);

// 8. 요청 거절 (관리자만)
router.post('/requests/:requestId/reject', 
    adminController.checkAuth, 
    adminController.checkAdmin, 
    adminController.rejectRequest
);

// 9. 노래 직접 추가 (관리자만)
router.post('/songs', 
    adminController.checkAuth, 
    adminController.checkAdmin, 
    adminController.createSong
);

// 10. 노래 직접 수정 (관리자만)
router.put('/songs/:id', 
    adminController.checkAuth, 
    adminController.checkAdmin, 
    adminController.updateSong
);

// 11. 노래 직접 삭제 (관리자만)
router.delete('/songs/:id', 
    adminController.checkAuth, 
    adminController.checkAdmin, 
    adminController.deleteSong
);

module.exports = router;