import { start as startChapter1 } from './chapter1/server1.js';
import { start as startChapter2 } from './chapter2/server2.js';
import { start as startChapter3 } from './chapter3/server3.js';

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

startServers();  