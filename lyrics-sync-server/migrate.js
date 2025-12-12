// lyrics-sync-server/migrate.js

require('dotenv').config();
const mongoose = require('mongoose');

// 새로 작성한 모델들 불러오기
const Song = require('./models/Song');
const PlayList = require('./models/PlayList');
// EditRequest는 기존 ID를 참조하므로, 데이터가 바뀌면 유효하지 않게 됩니다. 삭제하는 게 낫습니다.
const EditRequest = require('./models/EditRequest');

async function migrate() {
  console.log('🚀 마이그레이션 시작...');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ DB 연결 성공');

    // 1. 기존 데이터 Raw 상태로 읽어오기 (Mongoose 스키마 무시)
    const oldCollection = mongoose.connection.db.collection('songs');
    const oldSongs = await oldCollection.find({}).toArray();

    console.log(`📦 기존 데이터 ${oldSongs.length}개 발견. 변환 준비 중...`);

    if (oldSongs.length === 0) {
      console.log('데이터가 없습니다. 마이그레이션을 종료합니다.');
      process.exit(0);
    }

    // 2. 데이터 가공 (메모리 상에서 구조 변경)
    // Key: "제목|가수" (String)
    // Value: { songData, collectionNames(Set) }
    const songMap = new Map();

    for (const doc of oldSongs) {
      // 기존 데이터 필드 확인 (사용자 환경에 맞게 조정 필요할 수 있음)
      const title = doc.title;
      const artist = doc.artist;
      const key = `${title}|${artist}`;

      // 퀴즈 객체 생성
      const quiz = {
        original_lyrics: doc.original_lyrics,
        translated_lyrics: doc.translated_lyrics,
        hint: doc.hint
      };

      if (!songMap.has(key)) {
        songMap.set(key, {
          title: title,
          artist: artist,
          quizzes: [quiz],
          collectionNames: new Set(doc.collectionNames || []) // 배열을 Set으로 변환 (중복 제거)
        });
      } else {
        // 이미 있는 노래(제목+가수 같음)라면 퀴즈만 추가하고, 컬렉션 태그 병합
        const existing = songMap.get(key);
        existing.quizzes.push(quiz);
        if (doc.collectionNames) {
          doc.collectionNames.forEach(c => existing.collectionNames.add(c));
        }
      }
    }

    console.log(`🔄 가공 완료: 총 ${songMap.size}개의 유니크한 노래로 병합됨.`);

    // 3. 기존 컬렉션 삭제 (Drop)
    console.log('🗑️  기존 컬렉션 삭제 중...');
    try {
        await oldCollection.drop();
        await mongoose.connection.db.collection('playlists').drop().catch(() => {}); // 혹시 있으면 삭제
        await mongoose.connection.db.collection('editrequests').drop().catch(() => {}); // 요청 데이터 초기화
    } catch (e) {
        console.log('   (삭제할 컬렉션이 없거나 이미 비워짐)');
    }

    // 4. 새로운 데이터 저장
    console.log('💾 새로운 데이터 저장 시작...');

    // 플레이리스트 매핑용: Key=모음집이름, Value=[SongId들]
    const playlistMap = new Map();

    for (const item of songMap.values()) {
      // 4-1. Song 저장
      const newSong = new Song({
        title: item.title,
        artist: item.artist,
        quizzes: item.quizzes
      });
      await newSong.save();

      // 4-2. 플레이리스트 분류
      item.collectionNames.forEach(cName => {
        if (!cName) return;
        const safeName = cName.trim();
        if (!playlistMap.has(safeName)) {
          playlistMap.set(safeName, []);
        }
        playlistMap.get(safeName).push(newSong._id);
      });
    }

    // 5. PlayList 저장
    for (const [name, songIds] of playlistMap.entries()) {
      const newPlayList = new PlayList({
        name: name,
        description: `${name} 모음집 (자동 생성됨)`,
        songs: songIds
      });
      await newPlayList.save();
      console.log(`   - 모음집 생성: ${name} (${songIds.length}곡)`);
    }

    console.log('✨ 마이그레이션 성공적으로 완료!');

  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();