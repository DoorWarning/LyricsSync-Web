import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 1. 현재 모드(development/production)에 맞는 .env 파일을 로드합니다.
  // process.cwd()는 현재 프로젝트 루트 경로입니다.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        // 2. '/api'로 시작하는 요청은 환경 변수의 VITE_SERVER_URL로 보냅니다.
        '/api': {
          target: env.VITE_SERVER_URL || 'http://localhost:3001', // 없으면 기본값 5000
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})