// config/db.js
const mongoose = require('mongoose');
const Song = require('../models/Song'); // 시딩을 위해 모델 임포트

const MONGO_URI = process.env.MONGO_URI;

async function connectToDb() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Atlas에 성공적으로 연결되었습니다.');
    
    // DB가 비어있으면 테스트 데이터(시드) 삽입
    const count = await Song.countDocuments();
    if (count === 0) {
      console.log('테스트용 노래 데이터를 삽입합니다...');
      await Song.insertMany([
        { 
          title: "붉은 노을", 
          artist: "이문세", 
          original_lyrics: "붉게 물든 노을 바라보면 슬픈 그대 얼굴 생각이나",
          translated_lyrics: "If you look at the red sunset, I think of your sad face",
          hint: "ㅂㅇ ㄴㅇ",
          collectionNames: ["kpop-classics"]
        },
        { 
          title: "밤편지", 
          artist: "아이유", 
          original_lyrics: "이 밤 그날의 반딧불을 당신의 창 가까이 보낼게요",
          translated_lyrics: "I'll send the fireflies of that night near your window tonight",
          hint: "ㅂㅍㅈ",
          collectionNames: ["kpop-ballads", "IU-specials"]
        }
      ]);
      console.log('데이터 삽입 완료.');
    } else {
      console.log('DB에 노래 데이터가 이미 존재합니다.');
    }
  } catch (err) {
    console.error('DB 연결 오류:', err.message);
  }
}

module.exports = connectToDb;