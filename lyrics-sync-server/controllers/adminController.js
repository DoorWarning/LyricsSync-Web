// controllers/adminController.js

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Song = require('../models/Song');
const EditRequest = require('../models/EditRequest');
const geminiModel = require('../config/gemini');
const { exec } = require('child_process'); // Webhook용 exec 추가

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// ---------------------------------------------------------
// 1. 인증 및 미들웨어
// ---------------------------------------------------------

// JWT 검증 미들웨어
exports.checkAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); 
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return res.status(401).json({ success: false, message: '유효하지 않은 사용자입니다.' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: '토큰이 만료되었거나 유효하지 않습니다.' });
  }
};

// [미들웨어] 관리자(Admin) 권한 확인
exports.checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
  }
};

// 구글 로그인 & 유저 식별 (JWT 발급)
exports.googleLogin = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, picture, role: 'viewer' });
      await user.save();
    }

    const jwtToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
    );

    res.json({ 
      success: true, 
      token: jwtToken, 
      user: { email: user.email, name: user.name, role: user.role } 
    });

  } catch (err) {
    res.status(401).json({ success: false, message: '인증 실패: ' + err.message });
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
    const prompt = `당신은 "옛날 구글 번역기"입니다. 다음 가사를 아래 규칙에 따라 번역하세요.
    
    규칙:
    1. 가사를 옛날 구글번역기의 어색한 번역투로 번역한다.
    2. 가사에 한국어와 다른 언어가 섞여 있다면 한국어는 영어로 어색하게 번역하고, 다른 언어는 한국어로 어색하게 번역한다.
    3. 가사가 한국어라면 영어로 어색하게 번역한다.
    4. 가사가 일본어, 영어 등 한국어가 아닌 언어라면 한국어로 어색하게 번역한다.
    5. 최종 번역본만 응답으로 제공한다. 다른 설명은 붙이지 않는다.
    
    원본 가사:
    """
    ${originalLyrics}
    """
    
    번역:`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const translatedLyrics = response.text().trim();
    res.json({ success: true, translatedLyrics });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gemini 오류: ' + err.message });
  }
};


// ---------------------------------------------------------
// 3. 요청 시스템 (Viewer는 요청만)
// ---------------------------------------------------------

// 수정 요청 제출
exports.submitRequest = async (req, res) => {
  try {
    const { requestType, targetSongId, data } = req.body;
    const requesterEmail = req.user.email;

    // 배열 데이터 처리
    if (data && typeof data.collectionNames === 'string') {
      data.collectionNames = data.collectionNames.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newRequest = new EditRequest({
      requesterEmail,
      requestType,
      targetSongId, // create일 때는 null
      data,         // delete일 때는 null
      status: 'pending'
    });

    await newRequest.save();
    res.json({ success: true, message: '관리자에게 요청이 전송되었습니다.' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ---------------------------------------------------------
// 4. 관리자 전용 기능 (Admin Only - 즉시 처리)
// ---------------------------------------------------------

// 대기 중인 요청 목록 조회
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await EditRequest.find({ status: 'pending' })
      .populate('targetSongId') 
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

// Webhook 핸들러
exports.handleWebhook = (req, res) => {
  console.log('--- GitHub Webhook 수신 ---');
  res.status(200).send('Webhook received.');
  exec('./deploy.sh', { cwd: __dirname + '/../' }, (error, stdout, stderr) => {
    if (error) console.error(`Deployment failed: ${error}`);
    else console.log(`stdout: ${stdout}`);
  });
};

// [관리자 직접 CRUD]
exports.createSong = async (req, res) => {
    try {
        // 배열 변환 로직 포함
        const { collectionNames, ...otherData } = req.body;
        const collectionsArray = typeof collectionNames === 'string' 
            ? collectionNames.split(',').map(s => s.trim()).filter(Boolean)
            : collectionNames;
        
        const newSong = new Song({ ...otherData, collectionNames: collectionsArray });
        await newSong.save();
        res.json({ success: true, song: newSong });
    } catch(err) { res.status(500).json({message: err.message}); }
};
exports.updateSong = async (req, res) => {
    try {
        const { collectionNames, ...otherData } = req.body;
        const collectionsArray = typeof collectionNames === 'string' 
            ? collectionNames.split(',').map(s => s.trim()).filter(Boolean)
            : collectionNames;
        const updatedSong = await Song.findByIdAndUpdate(req.params.id, { ...otherData, collectionNames: collectionsArray }, { new: true });
        res.json({ success: true, song: updatedSong });
    } catch(err) { res.status(500).json({message: err.message}); }
};
exports.deleteSong = async (req, res) => {
    try {
        await Song.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: '삭제됨' });
    } catch(err) { res.status(500).json({message: err.message}); }
};