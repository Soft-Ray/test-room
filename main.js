import express from 'express';
import path from 'path';

// ES6 모듈에서 __dirname 대신 사용
const __dirname = path.dirname(new URL(import.meta.url).pathname);

import { start as startChapter1 } from './chapter1/server1.js';
import { start as startChapter2 } from './chapter2/server2.js';
import { start as startChapter3 } from './chapter3/server3.js';

const app = express();
const PORT = process.env.PORT || 10000;

// 각 서버의 start 함수를 비동기적으로 실행
const startServers = async () => {
  try {
    await Promise.all([
      startChapter1(),  // Chapter 1 서버 시작
      startChapter2(),  // Chapter 2 서버 시작
      startChapter3()   // Chapter 3 서버 시작
    ]);
  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
  }
};

// 기본 페이지 (index0.html) 경로 수정
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index0.html'));  // 절대 경로로 수정
});

// 시작 함수 실행
startServers();

app.listen(PORT, () => {
  console.log(`메인 서버가 ${PORT}번 포트에서 실행 중`);
});
