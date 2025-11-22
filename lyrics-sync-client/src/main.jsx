// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './global.css' // ⭐ global.css 임포트 확인
import { SoundProvider } from './context/SoundContext'; // [추가]

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> // 개발 모드에서 두 번 렌더링 방지 위해 주석 처리 가능
    <SoundProvider>
      <App />
    </SoundProvider>
  // </React.StrictMode>,
);