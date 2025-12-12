const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Song = require('../models/Song');
const EditRequest = require('../models/EditRequest');
const PlayList = require('../models/PlayList');
const { exec } = require('child_process');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// =========================================================
// 1. 인증 및 권한 미들웨어
// =========================================================

exports.checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(401).json({ success: false, message: '유효하지 않은 사용자입니다.' });
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '토큰이 만료되었거나 유효하지 않습니다.' });
  }
};

exports.checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
  }
};

// =========================================================
// 2. 로그인 및 기본 기능
// =========================================================

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
      user: { email: user.email, name: user.name, role: user.role, picture: user.picture } 
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(401).json({ success: false, message: '인증 실패: ' + err.message });
  }
};

exports.getSongs = async (req, res) => {
  try {
    const songs = await Song.aggregate([
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: 'playlists',
          localField: '_id',
          foreignField: 'songs',
          as: 'playlists'
        }
      },
      {
        $addFields: {
          collectionNames: { 
            $map: { input: "$playlists", as: "pl", in: "$$pl.name" } 
          }
        }
      },
      { $project: { playlists: 0 } }
    ]);
    res.json({ success: true, songs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateTranslation = async (req, res) => {
  const { originalLyrics } = req.body;
  if (!originalLyrics) return res.status(400).json({ success: false, message: '가사 입력 필요' });

  try {
    const rules = `
    1. 가사를 옛날 구글번역기의 어색한 번역투로 번역한다.
    2. 원본 가사가 한국어이면, 영어로 어색하게 번역한다.
    3. 원본 가사가 영어, 일본어 등 한국어가 아니면, 한국어로 어색하게 번역한다.
    4. 최종 번역본만 응답으로 제공한다. 다른 설명은 붙이지 않는다.
    `;
    
    const promptText = `당신은 옛날 구글 번역기입니다. 다음 규칙에 따라 번역하세요: ${rules} \n\n 원본 가사: ${originalLyrics}`;
    const safePrompt = JSON.stringify(promptText);
    const command = `gemini ${safePrompt}`; 

    const runCli = () => new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) reject(stderr || error.message);
        else resolve(stdout.trim());
      });
    });

    const translatedLyrics = await runCli();
    res.json({ success: true, translatedLyrics });

  } catch (err) {
    console.error('CLI Error:', err);
    res.status(500).json({ success: false, message: '번역 생성 실패: ' + err });
  }
};

// =========================================================
// 3. 요청 시스템 (일반 유저 -> 관리자)
// =========================================================

exports.submitRequest = async (req, res) => {
  try {
    const { requestType, targetSongId, data } = req.body;
    const requesterEmail = req.user.email;

    console.log(">>> [요청 접수] 데이터:", JSON.stringify(data, null, 2));

    if (data && typeof data.collectionNames === 'string') {
      data.collectionNames = data.collectionNames.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newRequest = new EditRequest({
      requesterEmail,
      requestType,
      targetSongId,
      data, // Mixed 타입 저장
      status: 'pending'
    });

    await newRequest.save();
    res.json({ success: true, message: '관리자에게 요청이 전송되었습니다.' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

// ⭐ [핵심 기능] 요청 승인 및 삭제/청소 로직
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // 1. 요청 정보 조회
    const request = await EditRequest.findById(requestId);
    
    if (!request) return res.status(404).json({ success: false, message: '요청을 찾을 수 없습니다.' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: '이미 처리된 요청입니다.' });

    console.log(`>>> [승인 시작] 타입: ${request.requestType}, 대상 ID: ${request.targetSongId}`);

    // 2. 삭제 요청 우선 처리 (데이터 파싱 불필요)
    if (request.requestType === 'delete') {
      if (!request.targetSongId) {
          return res.status(400).json({ success: false, message: '삭제할 대상 ID가 없습니다.' });
      }
      
      // 2-1. 노래 삭제
      const deletedSong = await Song.findByIdAndDelete(request.targetSongId);
      
      if (!deletedSong) {
          console.warn(`⚠️ [경고] 삭제 실패: ID(${request.targetSongId})에 해당하는 노래가 DB에 없습니다.`);
      } else {
          console.log(`✅ [삭제 완료] 노래 삭제됨: ${deletedSong.title}`);
      }

      // 2-2. 플레이리스트에서 참조 제거
      await PlayList.updateMany({ songs: request.targetSongId }, { $pull: { songs: request.targetSongId } });

      // 2-3. 빈 플레이리스트 청소
      const cleanResult = await PlayList.deleteMany({ songs: { $size: 0 } });
      if (cleanResult.deletedCount > 0) {
          console.log(`🧹 [청소 완료] 빈 플레이리스트 ${cleanResult.deletedCount}개 삭제됨`);
      }

      request.status = 'approved';
      await request.save();

      return res.json({ success: true, message: '삭제 요청 승인 및 정리 완료' });
    }

    // ---------------------------------------------------------
    // 3. Create / Update 요청 처리
    // ---------------------------------------------------------

    const requestData = request.data || {};
    const { title, artist, quizzes, collectionNames } = requestData;

    console.log("승인할 데이터 확인:", JSON.stringify(requestData, null, 2));

    // 퀴즈 데이터 정제
    let quizzesToSave = [];
    if (Array.isArray(quizzes) && quizzes.length > 0) {
        quizzesToSave = quizzes;
    } else if (requestData.original_lyrics) {
        quizzesToSave = [{
            original_lyrics: requestData.original_lyrics,
            translated_lyrics: requestData.translated_lyrics,
            hint: requestData.hint || ''
        }];
    }

    if (request.requestType === 'create') {
        let song = await Song.findOne({ title, artist });
        
        if (song) {
            // 이미 존재하면 퀴즈 추가
            if (quizzesToSave.length > 0) {
                await Song.findByIdAndUpdate(song._id, { 
                    $push: { quizzes: { $each: quizzesToSave } } 
                });
            }
        } else {
            // 없으면 새로 생성
            song = new Song({ 
                title, 
                artist, 
                quizzes: quizzesToSave 
            });
            await song.save();
        }

        const savedSong = await Song.findOne({ title, artist });

        const collectionsArray = Array.isArray(collectionNames) ? collectionNames : [];
        for (const name of collectionsArray) {
             await PlayList.findOneAndUpdate(
                { name: name.trim() },
                { 
                    $setOnInsert: { description: `${name} 모음집` }, 
                    $addToSet: { songs: savedSong._id } 
                },
                { upsert: true }
            );
        }
    } 
    else if (request.requestType === 'update') {
      const updateData = { title, artist };
      if (quizzesToSave.length > 0) {
          updateData.quizzes = quizzesToSave;
      }
      await Song.findByIdAndUpdate(request.targetSongId, updateData);
    } 

    request.status = 'approved';
    await request.save();

    res.json({ success: true, message: '승인 완료 및 반영됨' });

  } catch (err) {
    console.error("Approve Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    await EditRequest.findByIdAndUpdate(requestId, { status: 'rejected' });
    res.json({ success: true, message: '요청이 거절되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =========================================================
// 4. 관리자 직접 CRUD
// =========================================================

exports.createSong = async (req, res) => {
    try {
        const { title, artist, collectionNames, quizzes } = req.body;

        const collectionsArray = typeof collectionNames === 'string' 
          ? collectionNames.split(',').map(s => s.trim()).filter(Boolean)
          : collectionNames;

        let quizzesToSave = quizzes;
        if (!quizzesToSave || !Array.isArray(quizzesToSave)) {
            quizzesToSave = [{
                original_lyrics: req.body.original_lyrics,
                translated_lyrics: req.body.translated_lyrics,
                hint: req.body.hint
            }];
        }

        let song = await Song.findOne({ title, artist });
        
        if (song) {
          song.quizzes.push(...quizzesToSave);
          await song.save();
        } else {
          song = new Song({
            title,
            artist,
            quizzes: quizzesToSave
          });
          await song.save();
        }

        if (collectionsArray && collectionsArray.length > 0) {
          for (const name of collectionsArray) {
            await PlayList.findOneAndUpdate(
              { name: name.trim() },
              { $setOnInsert: { description: `${name} 모음집` }, $addToSet: { songs: song._id } },
              { upsert: true, new: true }
            );
          }
        }

        res.json({ success: true, song, message: '노래 등록 완료' });
    } catch(err) { 
        console.error(err);
        res.status(500).json({message: err.message}); 
    }
};

exports.updateSong = async (req, res) => {
    try {
        const { title, artist, quizzes } = req.body;
        
        const updatedSong = await Song.findByIdAndUpdate(
            req.params.id, 
            { title, artist, quizzes }, 
            { new: true }
        );

        res.json({ success: true, song: updatedSong });
    } catch(err) { res.status(500).json({message: err.message}); }
};

// ⭐ [핵심 기능] 관리자 직접 삭제 (청소 포함)
exports.deleteSong = async (req, res) => {
    try {
        const songId = req.params.id;
        console.log(`>>> [직접 삭제 시도] ID: ${songId}`);

        // 1. 노래 삭제
        const deletedSong = await Song.findByIdAndDelete(songId);

        if (!deletedSong) {
            console.warn(`⚠️ [경고] 삭제 실패: DB에서 ID(${songId})를 찾을 수 없습니다.`);
            return res.status(404).json({ success: false, message: '이미 삭제되었거나 존재하지 않는 노래입니다.' });
        }

        console.log(`✅ [삭제 완료] ${deletedSong.title} (${deletedSong.artist})`);

        // 2. 플레이리스트에서 참조 제거
        await PlayList.updateMany({ songs: songId }, { $pull: { songs: songId } });

        // 3. 빈 플레이리스트 청소
        const cleanResult = await PlayList.deleteMany({ songs: { $size: 0 } });
        if (cleanResult.deletedCount > 0) {
            console.log(`🧹 [청소 완료] 빈 플레이리스트 ${cleanResult.deletedCount}개 삭제됨`);
        }

        res.json({ success: true, message: '정상적으로 삭제되었습니다.' });
    } catch(err) { 
        console.error("Delete Error:", err);
        res.status(500).json({message: err.message}); 
    }
};

// ⭐ [수정] Webhook 처리: "선 응답, 후 배포" 패턴 적용
exports.handleWebhook = (req, res) => {
  console.log('🚀 [Webhook] GitHub Push 감지됨!');

  // 1. GitHub에게 즉시 성공 응답을 보냄 (기다리지 않게 함)
  res.status(200).json({ success: true, message: 'Webhook received. Deployment started in background.' });

  // 2. 응답 후, 백그라운드에서 배포 스크립트 실행 (비동기 처리)
  // setTimeout을 사용하여 현재 요청-응답 사이클을 끊어줍니다.
  setTimeout(() => {
      console.log('🔄 [Deploy] 배포 스크립트 실행 시작...');
      
      // exec 옵션에 maxBuffer를 늘려 로그가 길어도 끊기지 않게 함
      exec('./deploy.sh', { cwd: __dirname + '/../', maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ [Deploy Error] 배포 실패: ${error.message}`);
          console.error(`Stderr: ${stderr}`);
          return;
        }
        
        console.log(`✅ [Deploy Success] 배포 성공!`);
        console.log(`Stdout: ${stdout}`);
        
        // (선택 사항) 필요하다면 여기서 관리자에게 이메일/슬랙 알림 등을 보낼 수 있음
      });
  }, 1000); // 1초 뒤 실행
};