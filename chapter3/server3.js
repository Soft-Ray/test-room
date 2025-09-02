import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const app = express();
const port = 4003;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server1, Server2, Server3 모두에 적용
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:4001',
      'http://localhost:4002', 
      'http://localhost:4003',
      'http://127.0.0.1:4001',
      'http://127.0.0.1:4002',
      'http://127.0.0.1:4003',
      'http://127.0.0.1:5500', // 🔥 Live Server 포트 추가
      'http://localhost:5500',  // 🔥 Live Server 포트 추가
      null // 로컬 파일 접근 허용
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`[CORS] 차단된 origin: ${origin}`);
      callback(null, true); // 개발 환경에서는 모든 origin 허용
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With']
}));

// 추가 헤더 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(bodyParser.json());
app.use(express.json());

// 🔥 정적 파일을 루트에서 서빙 (이미지 문제 해결)
app.use(express.static(__dirname));

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 전역 변수
let userProgress = {};
let playerNameStorage = {};

// 🔥 플레이어 이름을 반환하는 GET 엔드포인트 (수정됨)
app.get('/chapter3', async (req, res) => {
  const clientId = req.ip || 'default-client';
  let playerName = playerNameStorage[clientId];
  
  // 저장된 이름이 없으면 다른 서버에서 가져오기 시도
  if (!playerName || playerName === '플레이어') {
    const fetchedName = await fetchPlayerNameFromOtherServers(clientId);
    if (fetchedName) {
      playerName = fetchedName;
      playerNameStorage[clientId] = fetchedName;
    } else {
      playerName = '플레이어';
    }
  }
  
  console.log(`📛 GET /chapter3 - Player Name: ${playerName}`);
  
  res.json({ 
    name: playerName,
    message: 'Chapter 3 ready'
  });
});

// 🔥 루트 경로에서 index3.html 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index3.html'));
});

// 🔥 다른 서버에서 이름을 받는 엔드포인트 추가
app.post('/set-name', (req, res) => {
  const { name, clientId } = req.body;
  const id = clientId || req.ip || 'default-client';
  
  if (name && name.trim() !== '' && name !== '플레이어') {
    playerNameStorage[id] = name.trim();
    console.log(`✅ 다른 서버로부터 이름 받음: ${name} (${id})`);
  }
  
  res.json({ success: true, name: playerNameStorage[id] });
});

// 다른 서버들에게 이름을 전송하는 함수
async function broadcastPlayerName(playerName, clientId) {
  const servers = [
    'http://localhost:4001/set-name',  // server1
    'http://localhost:4002/set-name'   // server2
  ];

  const promises = servers.map(async (url) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: playerName,
          clientId: clientId 
        })
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

  await Promise.allSettled(promises);
}

// 🔥 다른 서버들에서 이름을 가져오는 함수
async function fetchPlayerNameFromOtherServers(clientId) {
  const servers = [
    'http://localhost:4001',  // server1
    'http://localhost:4002'   // server2
  ];

  for (const url of servers) {
    try {
      const response = await fetch(`${url}/get-player-name/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.name && data.name !== '플레이어') {
          console.log(`✅ ${url}에서 이름 가져옴: ${data.name}`);
          return data.name;
        }
      }
    } catch (error) {
      console.log(`❌ ${url}에서 이름 가져오기 실패:`, error.message);
    }
  }
  
  return null;
}

// POST: 챕터3 게임 로직 처리
app.post('/chapter3', async (req, res) => {
  console.log('받은 요청:', req.body);

  const userMessage = req.body.message || '';
  let playerName = req.body.name || '';
  const clientId = req.ip || 'default-client';

  // 🔥 플레이어 이름 처리 개선
  if (playerName && playerName !== 'playerName' && playerName !== '플레이어' && playerName.trim() !== '') {
    // 새로운 이름이 제공된 경우
    playerNameStorage[clientId] = playerName.trim();
    console.log(`새 이름 저장: ${playerName} (${clientId})`);
    await broadcastPlayerName(playerName, clientId);
  } else if (playerNameStorage[clientId]) {
    // 이미 저장된 이름이 있는 경우
    playerName = playerNameStorage[clientId];
    console.log(`저장된 이름 사용: ${playerName} (${clientId})`);
  } else {
    // 다른 서버들에서 이름 가져오기 시도
    const fetchedName = await fetchPlayerNameFromOtherServers(clientId);
    if (fetchedName) {
      playerName = fetchedName;
      playerNameStorage[clientId] = fetchedName;
      console.log(`다른 서버에서 가져온 이름: ${playerName} (${clientId})`);
    } else {
      playerName = '플레이어';
      console.log(`기본 이름 사용: ${playerName} (${clientId})`);
    }
  }

  console.log(`📛 Player Name: ${playerName}`);

  // 🔥 여기에 챕터3 게임 로직 추가
  if (userMessage.includes('안녕') || userMessage.includes('hello')) {
    return res.json({
      message: `${playerName}님, 드디어 여기까지 오셨군요! 마지막 방입니다.`,
      image: 'images/hap.gif'
    });
  }

  // OpenAI API 호출 (기본 응답)
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `당신은 스티브입니다. 플레이어 이름은 ${playerName}입니다. 챕터3에서 마지막 탈출을 도와주세요.` 
        },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = chatCompletion.choices[0].message.content.trim();
    res.json({ message: reply });
  } catch (error) {
    console.error('OpenAI API 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 다른 서버에서 현재 저장된 이름을 가져갈 수 있는 엔드포인트
app.get('/get-player-name/:clientId?', (req, res) => {
  const clientId = req.params.clientId || req.ip || 'default-client';
  const playerName = playerNameStorage[clientId] || '플레이어';
  console.log(`🔍 GET /get-player-name/${clientId} - 반환: ${playerName}`);
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

// 🔥 모든 서버에서 이름 동기화하는 엔드포인트
app.post('/sync-name', async (req, res) => {
  const clientId = req.ip || 'default-client';
  const playerName = playerNameStorage[clientId];
  
  if (playerName && playerName !== '플레이어') {
    await broadcastPlayerName(playerName, clientId);
    res.json({ success: true, name: playerName });
  } else {
    const fetchedName = await fetchPlayerNameFromOtherServers(clientId);
    if (fetchedName) {
      playerNameStorage[clientId] = fetchedName;
      res.json({ success: true, name: fetchedName });
    } else {
      res.json({ success: false, message: 'No name found' });
    }
  }
});

export function start() {
  app.listen(port, () => {
    console.log(`✅ Chapter 3 server is running on http://localhost:${port}`);
    console.log(`🖼️ Images available at: http://localhost:${port}/images/`);
    console.log(`📄 Main page: http://localhost:${port}/`);
  });
}// 🔥 /chat 엔드포인트 추가 (클라이언트와 일치시키기 위해)
app.post('/chat', async (req, res) => {
  console.log('받은 요청:', req.body);

  const userMessage = req.body.message || '';
  let playerName = req.body.name || '';
  const clientId = req.ip || 'default-client';

  // 🔥 플레이어 이름 처리 개선
  if (playerName && playerName !== 'playerName' && playerName !== '플레이어' && playerName.trim() !== '') {
    // 새로운 이름이 제공된 경우
    playerNameStorage[clientId] = playerName.trim();
    console.log(`새 이름 저장: ${playerName} (${clientId})`);
    await broadcastPlayerName(playerName, clientId);
  } else if (playerNameStorage[clientId]) {
    // 이미 저장된 이름이 있는 경우
    playerName = playerNameStorage[clientId];
    console.log(`저장된 이름 사용: ${playerName} (${clientId})`);
  } else {
    // 다른 서버들에서 이름 가져오기 시도
    const fetchedName = await fetchPlayerNameFromOtherServers(clientId);
    if (fetchedName) {
      playerName = fetchedName;
      playerNameStorage[clientId] = fetchedName;
      console.log(`다른 서버에서 가져온 이름: ${playerName} (${clientId})`);
    } else {
      playerName = '플레이어';
      console.log(`기본 이름 사용: ${playerName} (${clientId})`);
    }
  }

  console.log(`📛 Player Name: ${playerName}`);

  // 🔥 여기에 챕터3 게임 로직 추가
  if (userMessage.includes('안녕') || userMessage.includes('hello')) {
    return res.json({
      message: `${playerName}님, 드디어 여기까지 오셨군요! 마지막 방입니다.`,
      image: 'images/hap.gif'
    });
  }

  // OpenAI API 호출 (기본 응답)
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `당신은 스티브입니다. 플레이어 이름은 ${playerName}입니다. 챕터3에서 마지막 탈출을 도와주세요.` 
        },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = chatCompletion.choices[0].message.content.trim();
    res.json({ message: reply });
  } catch (error) {
    console.error('OpenAI API 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// POST: 챕터3 게임 로직 처리 (기존 엔드포인트 유지)
app.post('/chapter3', async (req, res) => {
  // /chat과 동일한 로직으로 리다이렉트
  return app._router.handle(Object.assign(req, { url: '/chat', originalUrl: '/chat' }), res);
});
