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

app.use(cors({
  origin: '*', // 모든 도메인에서의 요청 허용 (개발 환경용)
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 상태 저장용 변수 - 클라이언트별로 관리하기 위해 객체 형태로 변경
let userProgress = {}; // 클라이언트별 진행 상태
let playerNameStorage = {}; // 플레이어 이름을 세션별로 저장

app.post('/chapter3', async (req, res) => {
    console.log('받은 요청:', req.body);
    
    const userMessage = req.body.message || '';
    const lowerMsg = userMessage.toLowerCase();
    
    // 클라이언트에서 전달된 이름 확인
    let playerName = req.body.name || '';
    
    // IP 또는 세션 ID로 클라이언트 식별 (간단한 구현)
    const clientId = req.ip || 'default-client';
    
    // 이름이 들어왔으면 저장
    if (playerName && playerName !== 'playerName') {
        playerNameStorage[clientId] = playerName;
        console.log(`저장된 플레이어 이름: ${playerName} (${clientId})`);
    }
    // 이름이 없으면 저장된 이름 사용
    else if (playerNameStorage[clientId]) {
        playerName = playerNameStorage[clientId];
        console.log(`저장된 이름 사용: ${playerName} (${clientId})`);
    }
    // 둘 다 없으면 기본값
    else {
        playerName = '플레이어';
        console.log(`기본 이름 사용: ${playerName} (${clientId})`);
    }
    
    console.log(`Player Name: ${playerName}`);
    
    // 사용자가 "예"를 입력한 경우
    if (lowerMsg.includes('예')) {
        return res.json({
            message: [
                { type: 'narration', text: '화면이 꺼진다. 당신은 의식을 잃는다.' },
                { type: 'narration', text: '...\n어두운 방에서 깨어난 당신.\n"스티브"라는 이름이 떠오른다.' },
                { text: `${playerName}: 여기가... 어디지?` },
                { type: 'narration', text: '게임 종료. 당신이 스티브가 되었습니다.' }
            ]
        });
    }
    
    // 사용자가 "아니오"를 입력한 경우
    if (lowerMsg.includes('아니오')) {
        return res.json({
            message: [
                { type: 'steve', text: '당신도... 결국 그들 중 하나였네요.' },
                { type: 'narration', text: '스티브는 조용히 돌아서 사라진다.' },
                { type: 'narration', text: '게임 종료. 당신은 자유를 택했지만, 남은 스티브는 어떻게 되었을까요?' }
            ]
        });
    }
    
    // 기본 응답 - 사용자가 어떤 텍스트를 입력하면 표시될 내용
    return res.json({
        message: [
            { type: 'narration', text: '화면에는 스티브가 감정을 드러내며 이야기하는 기록들이 가득하다. 실험기록이 나타난다.' },
            { type: 'steve', text: `어...? 이건... [${playerName}]... 당신 이름이에요.` },
            { type: 'steve', text: '왜 여기에... 절 가둔 게 당신인가요?' },
            { type: 'narration', text: '실험기록: 99 - 스티브\n"모든 피실험자 중 감정 반응이 가장 뚜렷함. 주체가 되기 적합."\n"곧 깨어날 준비를 할 것것."' },
            { type: 'narration', text: '당신의 인격이 이 실험에 가장 적합합니다.\n스티브를 자리를 대체하시겠습니까?\n[예] 또는 [아니오]로 대답하세요.' }
        ],
        image: 'images/sup.png'  // 원하는 이미지 경로 적용
    });
});

// 서버 상태 초기화 엔드포인트 (개발 테스트용)
app.post('/reset-server', (req, res) => {
    const clientId = req.ip || 'default-client';
    delete userProgress[clientId];
    console.log(`${clientId} 상태 초기화됨`);
    res.json({ status: 'ok', message: '서버 상태가 초기화되었습니다.' });
});

export function start() {
  app.listen(port, () => {
    console.log(`✅ Chapter 3 server is running on http://localhost:${port}`);
  });
}