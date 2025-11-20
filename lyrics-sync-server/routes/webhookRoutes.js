// routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Webhook 로직은 여기에 있습니다.

// Webhook 핸들러는 인증이 필요 없습니다.
const { handleWebhook } = adminController;

// GitHub은 /webhook/github 로 요청을 보냅니다.
// index.js에서 app.use('/webhook', router)로 등록하면 /webhook/github가 됩니다.
router.post('/github', handleWebhook);

module.exports = router;
