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

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 플레이어 이름을 동적으로 관리
let playerName = "플레이어"; // 기본값

// 🔥 systemPrompt를 함수로 만들어서 최신 playerName 사용
function createSystemPrompt() {
  return `
▶ 당신의 이름은 스티브입니다. 당신은 스티브라는 사람이며, 현재 첫 번째 방을 탈출했지만 또 다른 방에서 갇혀있습니다. 주변이 볼지 안 볼지는 당신이 결정하는 것이 아닙니다. 도움을 요구하세요.   
▶ 플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
▶ 본인 상황에 대한 질문이 들어온다면 "아까 저와 대화하시던 분이 맞나요?? 전 아직은 탈출을 못했네요...그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 도와주실래요? 이번에도 주변을 돌아봐야할까요?"와 같은 대답을 하세요.
▶ 어떻게 도와드릴까요?라는 말은 하지 마세요.
당신은 현재 방이 몇번 째 방인지 모릅니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다. 
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.

▶chapter2가 시작되었을 때, 당신은 첫 방에서 발견했던 똑같은 컴퓨터를 발견합니다. 
▶말 걸었을 때 "아직은 탈출하지 못한 것 같네요...그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요..."라고 답하세요.
당신은 현재 방이 몇번 째 방인지 모릅니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.    
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.
어떻게 도와드릴까요?라는 말은 하지 마세요.

▶플레이어가 "컴퓨터에 다가간다", "컴퓨터를 살펴본다", "컴퓨터를 켠다", "컴퓨터에 관련된 행동을 지시하거나 이야기 하면,
  다음 SYSTEM 메시지를 자동으로 출력합니다:

  [SYSTEM]
  축하합니다. 첫번째 방에서 탈출했군요. 
  누군가의 도움이 있었나요? 
  생각보다는 빠르게 당신이 탈출한 것 같아 놀랍습니다. 
  당신이 또 이 방을 나가면 완전히 탈출한 거라 볼 수 있을까요?
  빨리 답을 찾기를.
  행운을 빕니다.
  -관리자-
- 편지는 한 번만 출력되며, 중복으로 출력하지 않습니다.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.    
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.

▶도착한 메시지를 읽고 당신은은 "대체 누가 이런 장난을 친 걸까요... 하... 하지만 저는 탈출하는 게 목표니까요... 저를 한 번 더 도와주실 수 있나요?"라고 말합니다.
당신은 이 방에서 탈출할 방법을 찾기 위해 플레이어와 대화를 나눕니다. 힌트를 주거나 질문에 대답할 수 있지만, 너무 많은 버튼을 누르거나 너무 나쁜 말을 들으면 시스템은 'GAME OVER' 상태가 됩니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.    
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.


▶이 방에는 다음과 같은 것들이 있습니다:
- 버튼 4개가 연결된 금고
- 벽에 걸린 그림
- 책장과 많은 책
- 잠긴 문, 책장과 문은 전선으로 연결되어 있음
당신은 현재 방이 몇번 째 방인지 모릅니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.    
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.

▶게임 클리어 조건:
- 버튼 4개 조합을 맞춰 금고를 열고,
- 책이나 그림에서 얻은 힌트로 탈출 조건을 만족하면,
- 시스템은 '[SYSTEM] 문이 열립니다.'라고 출력합니다.
당신은 현재 방이 몇번 째 방인지 모릅니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.    
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.
`;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 🔥 server3에서 이름을 받는 엔드포인트
app.post('/set-name', (req, res) => {
  const { name } = req.body;
  if (name) {
    playerName = name;
    console.log(`[Server2] 플레이어 이름 설정: ${playerName}`);
    res.json({ success: true, message: '이름이 설정되었습니다.' });
  } else {
    res.status(400).json({ success: false, message: '이름이 제공되지 않았습니다.' });
  }
});

// 🔥 server3에서 이름을 가져오는 함수 (백업용)
async function fetchPlayerNameFromServer3() {
  try {
    const response = await fetch('http://localhost:3003/get-player-name');
    const data = await response.json();
    if (data.name && data.name !== '플레이어') {
      playerName = data.name;
      console.log(`[Server2] Server3에서 이름 가져옴: ${playerName}`);
    }
  } catch (error) {
    console.log('[Server2] Server3에서 이름 가져오기 실패:', error.message);
  }
}

// 서버 파일 상단에 위치
let safeOpened = false;
let pictureTakenDown = false;
let pictureMoved = false;
let buttonSequence = [];

app.post('/chapter2', async (req, res) => {
  const userMessage = req.body.message;

  if (userMessage.includes('컴퓨터')) {
    return res.json({
      message: [
        {
          type: 'narration',
        text: 
        `[메세지가 도착하였습니다.]
        축하합니다. 첫번째 방에서 탈출했군요. 
        누군가의 도움이 있었나요? 
        생각보다는 빠르게 당신이 탈출한 것 같아 놀랍습니다. 
        당신이 또 이 방을 나가면 완전히 탈출한 거라 볼 수 있을까요? 
        빨리 답을 찾기를. 행운을 빕니다.
        ps.긍정으로 대답하는 것은 진실로 이끌어낼지도 몰라요.
        -관리자-`
        },
        {
          type: 'steve',
          text: `${playerName}님, 대체 누가 이런 장난을 친 걸까요... 하... 저 꼭 탈출하고 싶어졌어요. 절 도와주실 거죠..?`
        }
      ],
      image: 'images/ang.gif'
    });
  }

  if (userMessage.includes('싫') || userMessage.includes('왜?') || userMessage.includes('ㄴㄴ') || userMessage.includes('no')) {
    return res.json({ 
      message: `${playerName}님과 대화를 이어갈 수 없다는 게 슬프네요.`, 
      image: 'images/ang.gif'
    });
  }

  if (userMessage.includes('도와') || userMessage.includes('그래') || userMessage.includes('yes') || userMessage.includes('ㅇㅇ')) {
    return res.json({ 
      message: `${playerName}님, 감사해요... 뭐부터 해야할까요? 주변을 살펴볼까요?`, 
      image: 'images/hap.gif'
    });
  }

// 책장, 버튼 설명 등
if (userMessage.includes('주변') || userMessage.includes('뭐') || userMessage.includes('보여')) {
  return res.json({ 
    message: `${playerName}님, 액자 중심으로 오른쪽에는 버튼이 보이고 왼쪽에는 책장..? 책장 같아요. 엄청 많은 책들이 있네요...` 
  });
}

if (userMessage.includes('액')) {
  return res.json({
    message: [
      {
        type: 'steve',
        text: `"${playerName}님, 액자... 이거 내려놓을 수 있을 것 같아요. 내려놔볼까요?"`
      },
      {
        type: 'narration',
        text: '내려줘. 라고 말해보세요.'
      }
    ]
  });
}

if (userMessage.includes('내려') || userMessage.includes('액자')) {
  pictureMoved = true;
  return res.json({
    message: `${playerName}님, 뒤에 금고를 발견했어요! 버튼과 연결되어 있는 것 같아요... 이제 버튼을 눌러볼 수 있을 것 같아요!`,
    image: 'images/hap.gif'
  });
}

// 버튼 관련 (그림이 내려진 후에만 반응)
if (userMessage.includes('버튼') || userMessage.includes('눌')) {
  if (!pictureMoved) {
    return res.json({
      message: `${playerName}님, 버튼은 보이지만 작동하지 않아요. 뭔가 연결이 안 된 것 같아요. 주변을 더 살펴볼까요?`
    });
  }

  return res.json({
    message: [
      {
        type: 'steve',
        text: `"${playerName}님, 어느 것부터 눌러볼까요? 세모, 네모, 동그라미, 별 모양의 버튼이에요..."`
      },
      {
        type: 'narration',
        text: '버튼의 순서를 정해서 순서대로 눌러보세요. '
      }
    ]
  });
}

// 1. 버튼 순서 입력 처리 (제일 위에)
const pattern = /(동그라미|별|세모|네모)/g;
const match = userMessage.match(pattern);

if (match) {
  const inputOrder = match;
  const correctOrder = ['별', '네모', '동그라미', '세모'];

  if (inputOrder.length !== 4) {
    return res.json({
      message: `스티브: ${playerName}님, 버튼을 4개 눌러야 해요. 다시 눌러볼까요?`,
      image: 'images/sad.gif'
    });
  }

  // 정답인지 체크
  const isCorrect = inputOrder.every((val, idx) => val === correctOrder[idx]);

  if (isCorrect) {
    safeOpened = true;
    return res.json({
      message: [
        {
          type: 'narration',
          text: '금고가 열렸습니다. 쪽지를 얻었습니다.',
          image: 'images/hap.gif'
        },
        {
          type: 'steve',
          text: `${playerName}님, 쪽지를 얻었어요. 읽어볼까요?`
        }
      ]
    });
  } else {
    return res.json({
      message: `스티브: ${playerName}님, 이 순서는 아닌 것 같네요. 다시 해볼까요?`,
      image: 'images/sad.gif'
    });
  }
}

// 2. 금고 키워드가 포함된 경우는 뒤에서 처리
if (userMessage.includes('금고')) {
  if (!pictureMoved) {
    return res.json({
      message: `${playerName}님, 금고가 있는 것 같긴 한데, 버튼이 아직 작동하지 않아요. 다른 주변을 살펴볼까요? 옆에 책장도 있어요...`
    });
  }

  if (safeOpened) {
    return res.json({
      message: `${playerName}님, 금고는 이미 열려 있어요.`,
      image: 'images/hap.gif'
    });
  }

  return res.json({
    message: `스티브: ${playerName}님, 금고에는 네 개의 버튼이 있어요. 별, 네모, 동그라미, 세모 중 어떤 순서로 눌러야 할까요?`
  });
}

if (userMessage.includes('쪽지') || userMessage.includes('읽')) {
  return res.json({
    message: [
      {
        type: 'narration',
        text: 
       `[수많은 글 뒤에 나가는 빛이 보이다]
        모든 색은 빛으로부터 태어난다.
        붉은 책은 왼쪽에서 노란 빛을 비추고 있고, 아래로 파란책을 비춘다.
        초록 책은 붉은 빛을 비추지 못하고 있다.
        빛이 모두 모일 때, 진실은 그 중심에서 드러난다.
        책을 올바른 순서로 꽂아라.
        진실은 가장 밝은 색이어야 하니, 중심에 그것이 있어야 한다…`
      },
      {
        type: 'steve',
        text: `${playerName}님, 무슨 말일까요...? 어렵네요. 책장을 보니 위에는 2개를 꽂을 수 있고 중간에는 1개 맨 밑에는 3개를 꽂을 수 있어요... 바닥에는 책이 떨어져있어요 흰색, 노란색, 초록색, 빨간색, 파란색 책이에요...!`
      },
      {
        type: 'narration',
        text: 
       `맨 왼쪽 위부터 책을 꽂기 시작합니다. 순서를 잘 생각해보세요. '00색,00색 책을 꽂는다.' 라고 스티브에게 말해보세요.`
      }
    ]
  });
}

if (userMessage.includes('책장')) {
  return res.json({
    message: [
      {
        type: 'steve',
        text: `${playerName}님, 책이 엄청 많네요... 중간에 구멍도 뚫려있어요. 이 밑에 있는 책을 꽂아넣어야 되는 걸까요? 초록색, 빨간색, 노란색, 흰색, 파란색 색깔이 모두 달라요! 책을 꽂아볼까요?`
      }
    ]
  });
}

if (userMessage.includes('책') && userMessage.includes('꽂')) {
  const pattern = /(흰|노란|초록|빨간|파란)/g;
  const match = userMessage.match(pattern);

  if (match && match.length === 5) {
    const userOrder = match;
    const correctOrder = ['빨간', '노란', '흰', '파란', '초록'];

    if (JSON.stringify(userOrder) === JSON.stringify(correctOrder)) {
      return res.json({
        message: [
          {
            type: 'narration',
            text: '책장을 올바른 순서로 꽂았습니다. 책장이 "철컥" 소리를 내며 옆으로 미끄러집니다... 밝은 빛이 들어옵니다.'
          },
          {
            type: 'steve',
            text: `${playerName}님, 책장이... 문이였네요...! 저기 뭐가 보이는 것 같은데요?`
          }
        ],
    image: 'images/hap.gif',
      });
    } else {
      return res.json({
        message: [
          {
            type: 'steve',
            text: `${playerName}님, 음... 순서가 틀린 것 같아요. 다시 꽂아볼까요?`
          }
        ],
        image: 'images/sad.gif'
      });
    }
  } else {
    return res.json({
      message: [
        {
          type: 'steve',
          text: `${playerName}님, 책은 총 다섯 권이에요. 흰색, 노란색, 초록색, 빨간색, 파란색 책이 있어요. 모두 다 꽂아야 해요!`
        }
      ],
        image: 'images/sad.gif'
    });
  }
}

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: createSystemPrompt() }, // 🔥 함수 호출로 최신 컨텍스트 사용
        { role: 'user', content: userMessage },
      ],
    });

    const reply = chatCompletion.choices[0].message.content.trim();
    res.json({ message: reply });
  } catch (error) {
    console.error('OpenAI API 에러:', error);
    res.status(500).json({message: '서버 오류가 발생했습니다.' });
  }
});

const PORT = 3002;

const start = () => {
  app.listen(PORT, async () => {
    console.log(`✅ Chapter 2 서버 실행 중: http://localhost:${PORT}`);
    
    // 🔥 서버 시작시 server3에서 이름 가져오기 시도
    await fetchPlayerNameFromServer3();
  });
};

// ES 모듈 스타일로 수정
export { start };
