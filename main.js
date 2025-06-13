const { start: startChapter1 } = require('./chapter1/server1.js');
const { start: startChapter2 } = require('./chapter2/server2.js');
const { start: startChapter3 } = require('./chapter3/server3.js');

const startServers = async () => {
  try {
    await Promise.all([
      startChapter1(),
      startChapter2(),
      startChapter3()
    ]);
  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
  }
};

startServers();
