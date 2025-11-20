// controllers/adminController.js
const Song = require('../models/Song');
const geminiModel = require('../config/gemini');
const { exec } = require('child_process');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
let adminToken = null; // (간단한 임시 토큰)

// 관리자 로그인
exports.login = (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    adminToken = `admin_token_${Date.now()}`;
    console.log('관리자 로그인 성공');
    res.json({ success: true, token: adminToken });
  } else {
    console.log('관리자 로그인 실패');
    res.status(401).json({ success: false, message: '비밀번호가 틀립니다.' });
  }
};

// 관리자 인증 미들웨어
exports.authAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token === adminToken && adminToken !== null) {
    next();
  } else {
    res.status(401).json({ success: false, message: '인증되지 않은 접근입니다.' });
  }
};

// (GET) 모든 노래 조회
exports.getSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ _id: -1 });
    res.json({ success: true, songs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// (POST) 새 노래 생성
exports.createSong = async (req, res) => {
  try {
    const { collectionNames, ...otherData } = req.body;
    const collectionsArray = collectionNames 
      ? collectionNames.split(',').map(s => s.trim()).filter(Boolean)
      : [];
      
    const newSong = new Song({ ...otherData, collectionNames: collectionsArray });
    await newSong.save();
    res.json({ success: true, song: newSong });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// (PUT) 노래 수정
exports.updateSong = async (req, res) => {
  try {
    const { collectionNames, ...otherData } = req.body;
    const collectionsArray = collectionNames 
      ? collectionNames.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    
    const updateData = { ...otherData, collectionNames: collectionsArray };
      
    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    res.json({ success: true, song: updatedSong });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// (DELETE) 노래 삭제
exports.deleteSong = async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '노래가 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// (POST) Gemini 번역
exports.generateTranslation = async (req, res) => {
  const { originalLyrics } = req.body;
  if (!originalLyrics) {
    return res.status(400).json({ success: false, message: '원본 가사를 입력하세요.' });
  }
  try {
    const prompt = `당신은 "옛날 구글 번역기"입니다. 다음 가사를 아래 규칙에 따라 번역하세요.
    
    규칙:
    1. 가사를 옛날 구글번역기의 어색한 번역투로 번역한다.
    2. 원본 가사가 한국어이면, 영어로 어색하게 번역한다.
    3. 원본 가사가 영어, 일본어 등 한국어가 아니면, 한국어로 어색하게 번역한다.
    4. 최종 번역본만 응답으로 제공한다. 다른 설명은 붙이지 않는다.
    
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
    console.error('Gemini API Error:', err);
    res.status(500).json({ success: false, message: 'Gemini API 오류: ' + err.message });
  }
};

// ⭐ [새로 추가] Webhook 수신 및 배포 실행 로직
exports.handleWebhook = (req, res) => {
  console.log('--- GitHub Webhook 수신: 서버 업데이트 시작 ---');
  // 즉시 200 OK 응답을 보내 GitHub 타임아웃을 방지합니다.
  res.status(200).send('Webhook received. Starting deployment script.');

  // deploy.sh 스크립트 비동기 실행 (서버 프로세스는 계속 유지)
  exec('./deploy.sh', { cwd: __dirname + '/../' }, (error, stdout, stderr) => { // ⭐ cwd를 서버 루트로 설정
    if (error) {
      console.error(`Deployment failed: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
};
