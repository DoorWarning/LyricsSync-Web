// src/views/LoginView.jsx
import React from 'react';

// [뷰 1] 로그인 화면
const LoginView = ({ nickname, setNickname, roomCode, setRoomCode, onCreateRoom, onJoinRoom }) => (
  <div className="flex justify-center items-center gap-12 mt-[10vh]">
    
    <div className="flex-shrink-0 text-left">
      <h1 className="text-6xl m-0 text-[var(--accent-blue)]">
        Lyrics<span className="text-[var(--accent-pink)]">Sync</span>
      </h1>
      <p className="text-xl text-[var(--secondary-text)] m-0">
        WEIRD TRANSLATION LYRICS QUIZ
      </p>
    </div>

    <div className="panel w-96 p-8">
      <div className="flex flex-col gap-4 mb-5">
        <label htmlFor="nickname-input" className="text-left text-[var(--secondary-text)]">닉네임</label>
        <input
          id="nickname-input"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="사용할 닉네임"
          className="w-full"
        />
      </div>
      <hr className="border-[var(--panel-bg)] my-5" />
      <div className="flex flex-col gap-4 mb-5">
        <h3>방 만들기</h3>
        <button onClick={onCreateRoom} disabled={!nickname.trim()} className="btn-primary w-full">
          새 방 만들기
        </button>
      </div>
      <hr className="border-[var(--panel-bg)] my-5" />
      <div className="flex flex-col gap-4">
        <h3>방 참가하기</h3>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="참여 코드 (4자리)"
          maxLength={4}
          className="w-full"
        />
        <button onClick={onJoinRoom} disabled={!nickname.trim() || !roomCode.trim()} className="btn-blue w-full">
          참가
        </button>
      </div>
    </div>
  </div>
);

export default LoginView;