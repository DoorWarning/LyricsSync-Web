// src/views/JoinLinkView.jsx
import React from 'react';

const JoinLinkView = ({ nickname, setNickname, roomCode, onJoinRoom, onGoBack }) => (
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
      <h2 className="mt-0">방 참가</h2>
      <p className="text-[var(--accent-blue)] text-lg">
        방 코드: <strong className="font-bold">{roomCode}</strong>
      </p>
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
      <div className="flex flex-col gap-4">
        <button onClick={onJoinRoom} disabled={!nickname.trim()} className="btn-primary">
          참가하기
        </button>
        <button onClick={onGoBack} className="btn-secondary">
          취소
        </button>
      </div>
    </div>
  </div>
);

export default JoinLinkView;