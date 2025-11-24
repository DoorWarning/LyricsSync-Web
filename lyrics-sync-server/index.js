// lyrics-sync-server/index.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectToDb = require('./config/db');

// 1. DB 연결
connectToDb();

// 2. 서버 및 미들웨어 설정
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://your-client-url.vercel.app', // ⭐ 본인의 실제 배포 주소로 수정 필요
  'https://your-admin-url.vercel.app'
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// ⭐ [보안 헤더 추가] Google 로그인 팝업 허용을 위한 설정
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 3. 라우트 등록
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

app.use('/api/admin', adminRoutes); 
app.use('/api/public', publicRoutes);
app.use('/webhook', webhookRoutes);

// 4. 소켓 핸들러 등록
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
const socketHandler = require('./sockets/socketHandler');
socketHandler(io);

// 5. 서버 실행
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});