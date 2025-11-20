// lyrics-sync-server/ecosystem.config.js

module.exports = {
  apps : [{
    name: "lyrics-sync-server",
    script: "index.js",
    
    // ⭐ [핵심] pm2에게 환경 변수 파일(.env)을 읽어오라고 지정
    env_production: {
      NODE_ENV: "production",
      // PM2에게 .env 파일을 읽어오라고 명령
      // 주의: 이 파일은 .gitignore에 포함되지 않아야 합니다.
      // (혹은 보안상 중요한 값은 이 파일 대신 OS 환경변수로 직접 설정해야 합니다.)
      // 하지만 여기서는 편의를 위해 .env를 사용하겠습니다.
      // ⚠️ 이 방식은 보안상 취약하므로, 실제 서비스에서는 사용하지 마세요.
    },
    
    // ⭐ Node.js의 환경 변수 로더를 사용하도록 설정
    // 이 설정은 PM2에게 Node.js가 dotenv를 실행하도록 지시합니다.
    node_args: ["-r", "dotenv/config"], 
    
    // 이 프로젝트의 루트 폴더를 지정합니다 (필수!)
    cwd: "./",
    
    // 서버가 꺼지면 자동으로 다시 시작
    instances: 1,
    exec_mode: "fork",
    watch: false,
    ignore_watch: ["node_modules"],
  }]
};
