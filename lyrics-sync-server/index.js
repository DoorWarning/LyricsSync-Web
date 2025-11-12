// index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectToDb = require('./config/db'); // ⭐ DB 연결 임포트

// 1. DB 연결
connectToDb();

// 2. 서버 및 미들웨어 설정
const app = express();
app.use(cors());
app.use(express.json()); 
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3001;

// 3. API 라우트 등록
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// 4. 소켓 핸들러 등록
const socketHandler = require('./sockets/socketHandler');
socketHandler(io);

// 5. 서버 실행
server.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});