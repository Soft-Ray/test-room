import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const app = express();
const port = 3003;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 설정
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(bodyParser.json());

// 🔥 정적 파일을 루트에서 서빙 (이미지 문제 해결)
app.use(express.static(__dirname));

// 🔥 루트 경로에서 index3.html 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index3.html'));
});

// 기존 /chapter3 경로도 유지 (호환성)
app.get('/chapter3', (req, res) => {
  res.sendFile(path.join(__dirname, 'index3.html'));
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = ``;

let userProgress = {};
let playerNameStorage = {};

// 다른 서버들에게 이름을 전송하는 함수
async function broadcastPlayerName(playerName) {
  const servers = [
    'http://localhost:3000/set-name',
    'http://localhost:3002/set-name'  // server2가 3002포트라고 가정
  ];

  const promises = servers.map(async (url) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName })
      });
      
      if (response.ok) {
        console.log(`✅ ${url}에 이름 전송 성공: ${playerName}`);
      } else {
        console.log(`❌ ${url}에 이름 전송 실패`);
      }
    } catch (error) {
      console.log(`❌ ${url} 통신 오류:`, error.message);
    }
  });

  // 모든 요청이 완료될 때까지 기다림 (실패해도 계속 진행)
  await Promise.allSettled(promises);
}

// POST: 이름 저장 및 응답
app.post('/chapter3', async (req, res) => {
  console.log('받은 요청:', req.body);

  const userMessage = req.body.message || '';
  let playerName = req.body.name || '';
  const clientId = req.ip || 'default-client';

  if (playerName && playerName !== 'playerName') {
    playerNameStorage[clientId] = playerName;
    console.log(`새 이름 저장: ${playerName} (${clientId})`);
    
    // 🔥 다른 서버들에게 이름 전송
    await broadcastPlayerName(playerName);
    
  } else if (playerNameStorage[clientId]) {
    playerName = playerNameStorage[clientId];
    console.log(`저장된 이름 사용: ${playerName} (${clientId})`);
  } else {
    playerName = '플레이어';
    console.log(`기본 이름 사용: ${playerName} (${clientId})`);
  }

  console.log(`📛 Player Name: ${playerName}`);
  res.json({ name: playerName });
});

// 다른 서버에서 현재 저장된 이름을 가져갈 수 있는 엔드포인트
app.get('/get-player-name/:clientId?', (req, res) => {
  const clientId = req.params.clientId || req.ip || 'default-client';
  const playerName = playerNameStorage[clientId] || '플레이어';
  res.json({ name: playerName });
});

// 서버 상태 초기화
app.post('/reset-server', (req, res) => {
  const clientId = req.ip || 'default-client';
  delete userProgress[clientId];
  delete playerNameStorage[clientId];
  console.log(`${clientId} 상태 초기화됨`);
  res.json({ status: 'ok', message: '서버 상태가 초기화되었습니다.' });
});

export function start() {
  app.listen(port, () => {
    console.log(`✅ Chapter 3 server is running on http://localhost:${port}`);
    console.log(`🖼️ Images available at: http://localhost:${port}/images/`);
    console.log(`📄 Main page: http://localhost:${port}/`);
  });
}