import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 모듈에서 __dirname 대신 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { start as startChapter1 } from './chapter1/server1.js';
import { start as startChapter2 } from './chapter2/server2.js';
import { start as startChapter3 } from './chapter3/server3.js';

const app = express();
const PORT = process.env.PORT || 5000;

// 각 서버의 start 함수를 비동기적으로 실행
const startServers = async () => {
  try {
    await Promise.all([
      startChapter1(),  // Chapter 1 서버 시작
      startChapter2(),  // Chapter 2 서버 시작
      startChapter3()   // Chapter 3 서버 시작
    ]);
    console.log('모든 챕터 서버가 성공적으로 시작되었습니다.');
  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
    throw error;
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'server.html'));
});

// 앱 초기화 및 서버 시작
const initializeApp = async () => {
  try {
    await startServers();
    app.listen(PORT, () => {
      console.log(`메인 서버가 ${PORT}번 포트에서 실행 중`);
    });
  } catch (error) {
    console.error('앱 초기화 중 오류 발생:', error);
    process.exit(1);
  }
};

initializeApp();
