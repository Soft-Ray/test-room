import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 설정 - Render 환경에 맞게 수정
app.use(cors({
  origin: function (origin, callback) {
    // Render 환경에서는 origin이 없을 수 있으므로 더 유연하게 설정
    const allowedOrigins = [
      'http://localhost:5001',
      'http://localhost:5002', 
      'http://localhost:5003',
      'http://127.0.0.1:5001',
      'http://127.0.0.1:5002',
      'http://127.0.0.1:5003',
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ];
    
    // Render 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV === 'production' || !origin) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // 개발 환경에서는 모든 origin 허용
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With']
}));

app.use(bodyParser.json());
app.use(express.json());

// 정적 파일을 루트에서 서빙
app.use(express.static(__dirname));

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 전역 변수
let userProgress = {};
let playerNameStorage = {};

// 플레이어 이름을 반환하는 GET 엔드포인트
app.get('/chapter3', async (req, res) => {
  const clientId = req.ip || 'default-client';
  let playerName = playerNameStorage[clientId];
  
  // 저장된 이름이 없으면 다른 서버에서 가져오기 시도 (Render에서는 주석 처리)
  if (!playerName || playerName === '플레이어') {
    // Render 환경에서는 localhost 접근 불가능하므로 주석 처리
    // const fetchedName = await fetchPlayerNameFromOtherServers(clientId);
    // if (fetchedName) {
    //   playerName = fetchedName;
    //   playerNameStorage[clientId] = fetchedName;
    // } else {
      playerName = '플레이어';
    // }
  }
  
  console.log(`📛 GET /chapter3 - Player Name: ${playerName}`);
  
  res.json({ 
    name: playerName,
    message: 'Chapter 3 ready'
  });
});

// 루트 경로에서 index3.html 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index3.html'));
});

// 다른 서버에서 이름을 받는 엔드포인트
app.post('/set-name', (req, res) => {
  const { name, clientId } = req.body;
  const id = clientId || req.ip || 'default-client';
  
  if (name && name.trim() !== '' && name !== '플레이어') {
    playerNameStorage[id] = name.trim();
    console.log(`✅ 다른 서버로부터 이름 받음: ${name} (${id})`);
  }
  
  res.json({ success: true, name: playerNameStorage[id] });
});

// 다른 서버들에게 이름을 전송하는 함수 (Render에서는 사용 불가)
async function broadcastPlayerName(playerName, clientId) {
  // Render 환경에서는 다른 서버와의 통신이 불가능하므로 주석 처리
  /*
  const servers = [
    'http://localhost:5001/set-name',  // server1
    'http://localhost:5002/set-name'   // server2
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
  */
  console.log(`[Render] 이름 브로드캐스트 시뮬레이션: ${playerName}`);
}

// 다른 서버들에서 이름을 가져오는 함수 (Render에서는 사용 불가)
async function fetchPlayerNameFromOtherServers(clientId) {
  // Render 환경에서는 localhost 접근이 불가능하므로 주석 처리
  /*
  const servers = [
    'http://localhost:5001',  // server1
    'http://localhost:5002'   // server2
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
  */
  
  return null;
}

// 다른 서버에서 현재 저장된 이름을 가져갈 수 있는 엔드포인트
app.get('/get-player-name/:clientId?', (req, res) => {
  const clientId = req.params.clientId || req.ip || 'default-client';
  const playerName = playerNameStorage[clientId] || '플레이어';
  console.log(`📖 GET /get-player-name/${clientId} - 반환: ${playerName}`);
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

// 모든 서버에서 이름 동기화하는 엔드포인트
app.post('/sync-name', async (req, res) => {
  const clientId = req.ip || 'default-client';
  const playerName = playerNameStorage[clientId];
  
  if (playerName && playerName !== '플레이어') {
    await broadcastPlayerName(playerName, clientId);
    res.json({ success: true, name: playerName });
  } else {
    // const fetchedName = await fetchPlayerNameFromOtherServers(clientId);
    // if (fetchedName) {
    //   playerNameStorage[clientId] = fetchedName;
    //   res.json({ success: true, name: fetchedName });
    // } else {
      res.json({ success: false, message: 'No name found' });
    // }
  }
});

// 메인 채팅 엔드포인트
app.post('/chat', async (req, res) => {
  try {
    console.log('받은 요청:', req.body);

    const userMessage = req.body.message || '';
    let playerName = req.body.name || '';
    const clientId = req.ip || 'default-client';

    // 플레이어 이름 처리 개선
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
      // 다른 서버들에서 이름 가져오기 시도 (Render에서는 주석 처리)
      // const fetchedName = await fetchPlayerNameFromOtherServers(clientId);
      // if (fetchedName) {
      //   playerName = fetchedName;
      //   playerNameStorage[clientId] = fetchedName;
      //   console.log(`다른 서버에서 가져온 이름: ${playerName} (${clientId})`);
      // } else {
        playerName = '플레이어';
        console.log(`기본 이름 사용: ${playerName} (${clientId})`);
      // }
    }

    console.log(`📛 Player Name: ${playerName}`);

    // 리셋 처리
    if (userMessage === 'reset') {
      userProgress[clientId] = {};
      return res.json({
        message: '게임이 초기화되었습니다.',
        image: 'images/hap.gif'
      });
    }

    // 챕터3 게임 로직 추가
    if (userMessage.includes('안녕') || userMessage.includes('hello') || userMessage.includes('시작')) {
      return res.json({
        message: `${playerName}님, 드디어 여기까지 오셨군요! 마지막 방입니다. 이제 정말로 탈출할 수 있을 것 같아요!`,
        image: 'images/hap.gif'
      });
    }

    // 거부 반응
    if (userMessage.includes('싫') || userMessage.includes('왜?') || 
        userMessage.includes('ㄴㄴ') || userMessage.includes('no') ||
        userMessage.includes('시발') || userMessage.includes('좆') || 
        userMessage.includes('병신')) {
      
      return res.json({ 
        message: `${playerName}님과 대화를 이어갈 수 없다는 게 슬프네요.`, 
        image: 'images/ang.gif'
      });
    }

    // 동의 반응
    if (userMessage.includes('도와') || userMessage.includes('그래') || 
        userMessage.includes('yes') || userMessage.includes('ㅇㅇ') ||
        userMessage.includes('알겠어') || userMessage.includes('ㅇㅋ')) {
      
      return res.json({ 
        message: `${playerName}님, 감사해요! 마지막까지 함께 해주셔서 정말 고마워요. 이번엔 꼭 탈출할 수 있을 거예요!`, 
        image: 'images/hap.gif'
      });
    }

    // 주변 탐색
    if (userMessage.includes('주변') || userMessage.includes('뭐') || 
        userMessage.includes('보여') || userMessage.includes('살펴') ||
        userMessage.includes('둘러')) {
      
      return res.json({ 
        message: `${playerName}님, 이 방은 이전 방들과는 다르네요. 더 밝고 넓어요. 중앙에 큰 문이 있고, 그 앞에는 복잡한 장치가 있어요.`,
        image: 'images/sup.gif'
      });
    }

    // OpenAI API 호출 (기본 응답)
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `당신은 스티브입니다. 플레이어 이름은 ${playerName}입니다. 챕터3에서 마지막 탈출을 도와주세요. 당신은 겁이 많지만 도움을 받고 싶어하는 캐릭터입니다.` 
        },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = chatCompletion.choices[0].message.content.trim();
    res.json({ message: reply });

  } catch (error) {
    console.error('OpenAI API 에러:', error);
    res.status(500).json({ 
      message: `${req.body.name || '플레이어'}님, 죄송해요. 잠시 생각이 멈췄네요... 다시 말씀해주시겠어요?`,
      image: 'images/sad.gif'
    });
  }
});

// POST: 챕터3 게임 로직 처리 (기존 엔드포인트 유지 - /chat로 리다이렉트)
app.post('/chapter3', (req, res) => {
  // /chat과 동일한 로직으로 처리
  req.url = '/chat';
  req.originalUrl = '/chat';
  return app.handle(req, res);
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('[Server3] 에러 핸들러:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// Render 배포용 start 함수
export function start() {
  const PORT = process.env.PORT || 5003;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Chapter 3 서버 실행 중: http://0.0.0.0:${PORT}`);
    console.log(`🖼️ Images available at: http://0.0.0.0:${PORT}/images/`);
    console.log(`📄 Main page: http://0.0.0.0:${PORT}/`);
    console.log(`🤖 OpenAI API 키 상태: ${process.env.OPENAI_API_KEY ? '설정됨' : '설정 안됨'}`);
    console.log(`🌐 CORS 정책: 모든 origin 허용 (Render 환경)`);
  });
}

// 직접 실행할 때도 서버 시작
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
