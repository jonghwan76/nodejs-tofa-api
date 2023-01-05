# 관련 라이브러리 설치
 1) npm install cors
 2) npm install express mysql
 3) npm install request

# PM2 사용법
 1) 프로젝트 실행 : pm2 start www
 2) 프로세스 상태확인 : pm2 status
 3) 프로세스 삭제 : pm2 delete [프로세스아이디]
 4) 모든 프로세스 없애기 : pm2 kill
 5) 프로세스 재실행 : pm2 restart <appname>
 6) 프로세스 리로드 : pm2 reload <appname>
 7) 성능 사용량, 프로세스 목록, 로그 확인 : pm2 monit
 8) 최근 서버로그를 15줄까지 : pm2 logs <appname>