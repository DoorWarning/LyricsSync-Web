import axios from 'axios';

const api = axios.create({
  // 배포(PROD) 환경이면 전체 주소 사용, 개발(DEV) 환경이면 빈 문자열(프록시 사용)
  baseURL: import.meta.env.PROD ? import.meta.env.VITE_SERVER_URL : '',
});

// 요청 보낼 때마다 토큰 자동 삽입 (인터셉터)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;