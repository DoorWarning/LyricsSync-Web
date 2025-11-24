// controllers/adminController.js

const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Song = require('../models/Song');
const EditRequest = require('../models/EditRequest');
const geminiModel = require('../config/gemini');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------------------------------------------------------
// 1. 인증 및 미들웨어
// ---------------------------------------------------------

// 구글 로그인 & 유저 식별 (Upsert)
exports.googleLogin = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // DB에서 유저 찾기, 없으면 생성 (기본 권한: viewer)
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, picture, role: 'viewer' });
      await user.save();
    }

    // 클라이언트에 유저 정보와 역할(Role) 반환
    res.json({ 
      success: true, 
      user: { 
        email: user.email, 
        name: user.name, 
        picture: user.picture,
        role: user.role 
      } 
    });

  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(401).json({ success: false, message: '인증 실패: ' + err.message });
  }
};

// [미들웨어] 로그인된 유저인지 확인
exports.checkUser = async (req, res, next) => {
  const userEmail = req.headers['x-user-email']; // 클라이언트가 헤더에 보낸 이메일
  if (!userEmail) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(401).json({ success: false, message: '유효하지 않은 유저입니다.' });
    
    req.user = user; // 다음 단계에서 쓸 수 있게 저장
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

// [미들웨어] 관리자(Admin)인지 확인
exports.checkAdmin = async (req, res, next) => {
  const userEmail = req.headers['x-user-email'];
  if (!userEmail) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

  try {
    const user = await User.findOne({ email: userEmail });
    if (user && user.role === 'admin') {
      req.user = user;
      next(); // 통과
    } else {
      res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};


// ---------------------------------------------------------
// 2. 기본 기능 (누구나 가능 - 로그인 필요)
// ---------------------------------------------------------

// 노래 목록 조회
exports.getSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ _id: -1 });
    res.json({ success: true, songs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Gemini 번역 생성
exports.generateTranslation = async (req, res) => {
  const { originalLyrics } = req.body;
  if (!originalLyrics) return res.status(400).json({ success: false, message: '가사 입력 필요' });

  try {
    const prompt = `당신은 "옛날 구글 번역기"입니다... (중략) ... 원본 가사: """${originalLyrics}""" 번역:`;
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const translatedLyrics = response.text().trim();
    res.json({ success: true, translatedLyrics });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gemini 오류: ' + err.message });
  }
};


// ---------------------------------------------------------
// 3. 요청 시스템 (Viewer는 요청만, Admin은 즉시 처리 가능)
// ---------------------------------------------------------

// 수정 요청 제출 (Viewer용)
exports.submitRequest = async (req, res) => {
  try {
    // requestType: 'create' | 'update' | 'delete'
    const { requestType, targetSongId, data } = req.body;
    const requesterEmail = req.user.email;

    // 배열 데이터 처리 (문자열로 왔을 경우)
    if (data && typeof data.collectionNames === 'string') {
      data.collectionNames = data.collectionNames.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newRequest = new EditRequest({
      requesterEmail,
      requestType,
      targetSongId, // create일 때는 null
      data,         // delete일 때는 null일 수도 있음
      status: 'pending'
    });

    await newRequest.save();
    res.json({ success: true, message: '관리자에게 요청이 전송되었습니다.' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ---------------------------------------------------------
// 4. 관리자 전용 기능 (Admin Only)
// ---------------------------------------------------------

// 대기 중인 요청 목록 조회
exports.getPendingRequests = async (req, res) => {
  try {
    // 최신순 정렬
    const requests = await EditRequest.find({ status: 'pending' })
      .populate('targetSongId') // 대상 노래 정보도 같이 가져옴 (어떤 노래를 수정하려는지 보기 위해)
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 요청 승인 (실제 Song DB에 반영)
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await EditRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: '요청을 찾을 수 없습니다.' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: '이미 처리된 요청입니다.' });

    // 요청 타입에 따라 DB 조작
    if (request.requestType === 'create') {
      const newSong = new Song(request.data);
      await newSong.save();
    } 
    else if (request.requestType === 'update') {
      if (!request.targetSongId) return res.status(400).json({ success: false, message: '대상 곡 ID가 없습니다.' });
      await Song.findByIdAndUpdate(request.targetSongId, request.data);
    } 
    else if (request.requestType === 'delete') {
      if (!request.targetSongId) return res.status(400).json({ success: false, message: '대상 곡 ID가 없습니다.' });
      await Song.findByIdAndDelete(request.targetSongId);
    }

    // 요청 상태 업데이트
    request.status = 'approved';
    await request.save();

    res.json({ success: true, message: '승인 완료. 데이터베이스에 반영되었습니다.' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 요청 거절
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    await EditRequest.findByIdAndUpdate(requestId, { status: 'rejected' });
    res.json({ success: true, message: '요청이 거절되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Webhook 핸들러 (기존 유지)
exports.handleWebhook = (req, res) => {
  const { exec } = require('child_process');
  console.log('--- GitHub Webhook 수신 ---');
  res.status(200).send('Webhook received.');
  exec('./deploy.sh', { cwd: __dirname + '/../' }, (error, stdout, stderr) => {
    if (error) console.error(`Deployment failed: ${error}`);
    else console.log(`stdout: ${stdout}`);
  });
};