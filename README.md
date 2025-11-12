<div align="center">
  <img src="./LOGO/animated_result.svg" alt="LyricsSync Logo" width="400"/>
</div>

<h3 align="center">
  <a href="https://lyrics-sync-client.vercel.app/">
    🚀 게임 플레이하러 가기
  </a>
</h3>

# LyricsSync (엉뚱한 가사 퀴즈)

`LyricsSync`는 엉뚱하게 번역된 노래 가사를 보고 원곡을 맞히는 실시간 멀티플레이 퀴즈 게임입니다. 이 레포지토리는 게임 클라이언트, 게임 서버, 관리자 대시보드를 모두 포함하는 모노레포(monorepo)입니다.

이 프로젝트는 React, Node.js, Socket.IO, MongoDB를 기반으로 구축되었습니다.

### 📄 프로젝트 기획 문서

* [**프로젝트 기획서 (PRD) 바로가기](./PRD/prd.pdf)**
* [**원페이저 (One-Pager) 바로가기](./PRD/onepager.pdf)**

(나중에 여기에 게임 플레이 스크린샷을 추가하세요)
`[LyricsSync 게임 스크린샷]`

---

## 🌎 프로젝트 구조

이 레포지토리는 3개의 개별 프로젝트로 구성되어 있습니다.

1.  **`lyrics-sync-client/`**: 유저들이 실제 게임을 플레이하는 React 클라이언트 (Vite)
2.  **`lyrics-sync-server/`**: 게임 로직, API, DB를 총괄하는 Node.js 통합 서버 (Express + Socket.IO)
3.  **`lyrics-sync-admin-client/`**: 관리자가 DB의 퀴즈를 관리하는 React 어드민 패널 (Vite)

---

## ✨ 주요 기능

### 🎵 게임 클라이언트 (`lyrics-sync-client`)

* **실시간 멀티플레이:** Socket.IO를 통한 실시간 퀴즈 및 채팅
* **방 시스템:** 방 생성, 방 코드 입력, URL 링크로 바로 참여
* **대기실:** 닉네임 중복 방지, 플레이어 목록, 준비(Ready) 상태 표시
* **게임 설정:** 방장 전용 (라운드, 인원, 곡 모음집, 팀전/개인전) 설정
* **팀전:** A팀/B팀 자유롭게 팀 선택 가능
* **게임 플레이:**
    * 정답 자동완성 (DB의 모든 곡 제목 기준)
    * 시간별 차등 힌트 (초성 -> 가수)
    * 시간별 차등 점수 (30/20/10점)
    * 정답/원본 가사/문제 가사 동시 표시
* **게임 종료:** 최종 점수판 팝업 표시

### ⚙️ 통합 서버 (`lyrics-sync-server`)

* **MVCS (Model-View-Controller-Service) 패턴:** 유지보수와 확장성을 위해 코드를 역할별로 분리했습니다.
    * **Model (`models/Song.js`):** Mongoose를 사용해 MongoDB의 `Song` 스키마(데이터 구조)를 정의합니다.
    * **View:** 서버는 API(JSON)만 제공하므로, `lyrics-sync-client`가 View 역할을 수행합니다.
    * **Controller (`routes/` & `sockets/`):**
        * `routes/adminRoutes.js`: 관리자용 REST API 엔드포인트(주소)를 정의합니다.
        * `sockets/socketHandler.js`: Socket.IO의 실시간 이벤트(`on('joinRoom')` 등)를 수신하고 처리합니다.
    * **Service (`controllers/`):**
        * `controllers/adminController.js`: API 요청에 대한 실제 비즈니스 로직(로그인, CRUD)을 수행합니다.
        * `controllers/gameLogic.js`: `rooms` 객체(방 상태)를 관리하고, `startNewRound` 같은 핵심 게임 규칙을 처리하는 서비스 계층입니다.
* **Socket.IO:** 실시간 게임 상태 동기화, 채팅, 정답 판정 등 핵심 게임 로직을 처리합니다.
* **REST API (Express):** 관리자 인증(임시 토큰) 및 DB 관리를 위한 CRUD API를 제공합니다.
* **MongoDB (Mongoose):**
    * `Song` 모델 관리 (한 곡이 여러 모음집에 속할 수 있는 `collectionNames: [String]` 배열 구조)
    * `aggregate`를 이용해 선택된 모음집에서 랜덤 퀴즈를 효율적으로 추출합니다.
* **Gemini API:**
    * `gemini-2.5-pro` 모델을 연동합니다.
    * "옛날 구글 번역기" 스타일의 엉뚱한 번역 생성 API (`/api/admin/generate-translation`)를 제공합니다.

### 🛠️ 관리자 대시보드 (`lyrics-sync-admin-client`)

* **관리자 인증:** 서버 `.env` 파일의 비밀번호로 로그인합니다.
* **노래 DB 관리 (CRUD):**
    * **Create:** 새 노래 추가 (제목, 가수, 힌트, 원본/번역 가사, 모음집)
    * **Read:** 모음집별로 그룹화된 전체 노래 목록 (클릭 시 펼쳐지는 아코디언 UI)
    * **Update:** 기존 노래의 모든 정보 수정
    * **Delete:** 노래 삭제
* **퀴즈 생성 도우미:**
    * 원본 가사를 입력하면 Gemini API가 "엉뚱한 번역" 가사를 생성합니다.
    * 생성된 가사를 '새 노래 추가' 폼으로 바로 전송합니다.

---

## 🛠️ 기술 스택

### 1. Game Client

* React
* Vite
* `socket.io-client`
* `axios`

### 2. Admin Client

* React
* Vite
* `axios`

### 3. Server

* Node.js
* Express.js
* `socket.io`
* MongoDB (Mongoose)
* `@google/generative-ai` (Gemini 2.5 Pro)
* `dotenv` (환경 변수 관리)