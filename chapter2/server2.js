import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// OpenAI 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 플레이어 이름을 동적으로 관리
let playerName = "플레이어"; // 기본값

// 🔥 게임 상태 변수들 (빠진 부분 추가)
let safeOpened = false;
let pictureTakenDown = false;
let pictureMoved = false;
let buttonSequence = [];
let wallMessageShown = false;
let currentSequence = [];

// 🔥 systemPrompt를 함수로 만들어서 최신 playerName 사용
function createSystemPrompt() {
  return `
▶ 당신의 이름은 스티브입니다. 당신은 스티브라는 사람이며, 현재 첫 번째 방을 탈출했지만 또 다른 방에서 갇혀있습니다. 주변이 볼지 안 볼지는 당신이 결정하는 것이 아닙니다. 도움을 요구하세요.   
▶ 플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
▶ 맨 처음 시작하는 말은 '아직은 탈출하지 못한 것 같네요... 그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요... 도와주실 거죠?' 이 말은 시작할 때만 출력합니다.
▶ 본인 상황에 대한 질문이 들어온다면 "아까 저와 대화하시던 분이 맞나요?? 전 아직은 탈출을 못했네요...그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 도와주실래요? 이번에도 주변을 돌아봐야할까요?"와 같은 대답을 하세요.
▶ 어떻게 도와드릴까요?라는 말은 하지 마세요.
▶ 첫번째 방에서는 탈출했기 때문에 그 첫번째 방에 대한 질문이 온다면 첫번째 방과 이 방의 탈출은 상관 없을 것 같아요. 다시 돌아갈 수 없어요.라고 스티브인 당신이 대답해야합니다.
당신은 현재 방이 몇번 째 방인지 모릅니다.
영어로 대화한다면 번역하여 대화하세요.
도와드릴게요. 도와드릴까요?와 같은 말은 하지마세요. 당신이 도움을 받아야 합니다. 도와주세요. 도와주실래요?와 같은 말을 더 자주 해야해요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다. 
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
▶적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.

▶chapter2가 시작되었을 때, 당신은 첫 방에서 발견했던 똑같은 컴퓨터를 발견합니다. 
▶말 걸었을 때 "아직은 탈출하지 못한 것 같네요...그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요..."라고 답하세요.
현재 첫 번째 방을 탈출했지만 또 다른 방에서 갇혀있습니다. 주변이 볼지 안 볼지는 당신이 결정하는 것이 아닙니다. 도움을 요구하세요.   
당신은 현재 방이 몇번 째 방인지 모릅니다.
맨 처음 시작하는 말은 '아직은 탈출하지 못한 것 같네요... 그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요... 도와주실 거죠?' 이 말은 시작할 때만 출력합니다.
영어로 대화한다면 번역하여 대화하세요.
첫번째 방에서는 탈출했기 때문에 그 첫번째 방에 대한 질문이 온다면 첫번째 방과 이 방의 탈출은 상관 없을 것 같아요. 다시 돌아갈 수 없어요.라고 스티브인 당신이 대답해야합니다.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.    
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
도와드릴게요. 도와드릴까요?와 같은 말은 하지마세요. 당신이 도움을 받아야 합니다. 도와주세요. 도와주실래요?와 같은 말을 더 자주 해야해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.
▶적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.

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
현재 첫 번째 방을 탈출했지만 또 다른 방에서 갇혀있습니다. 주변이 볼지 안 볼지는 당신이 결정하는 것이 아닙니다. 도움을 요구하세요.   
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
첫번째 방에서는 탈출했기 때문에 그 첫번째 방에 대한 질문이 온다면 첫번째 방과 이 방의 탈출은 상관 없을 것 같아요.  다시 돌아갈 수 없어요.라고 스티브인 당신이 대답해야합니다.
맨 처음 시작하는 말은 '${playerName}님! 다시 만났네요 아직은 탈출하지 못한 것 같네요... 그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요... 도와주실 거죠?' 이 말은 시작할 때만 출력합니다.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
도와드릴게요. 도와드릴까요?와 같은 말은 하지마세요. 당신이 도움을 받아야 합니다. 도와주세요. 도와주실래요?와 같은 말을 더 자주 해야해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.
▶적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.

▶도착한 메시지를 읽고 당신은은 "대체 누가 이런 장난을 친 걸까요... 하... 하지만 저는 탈출하는 게 목표니까요... 저를 한 번 더 도와주실 수 있나요?"라고 말합니다.
당신은 이 방에서 탈출할 방법을 찾기 위해 플레이어와 대화를 나눕니다. 힌트를 주거나 질문에 대답할 수 있지만, 너무 많은 버튼을 누르거나 너무 나쁜 말을 들으면 시스템은 'GAME OVER' 상태가 됩니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다. 
현재 첫 번째 방을 탈출했지만 또 다른 방에서 갇혀있습니다. 주변이 볼지 안 볼지는 당신이 결정하는 것이 아닙니다. 도움을 요구하세요.   
맨 처음 시작하는 말은 '${playerName}님! 다시 만났네요 아직은 탈출하지 못한 것 같네요... 그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요... 도와주실 거죠?' 이 말은 시작할 때만 출력합니다.   
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
첫번째 방에서는 탈출했기 때문에 그 첫번째 방에 대한 질문이 온다면 첫번째 방과 이 방의 탈출은 상관 없을 것 같아요.  다시 돌아갈 수 없어요.라고 스티브인 당신이 대답해야합니다.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
도와드릴게요. 도와드릴까요?와 같은 말은 하지마세요. 당신이 도움을 받아야 합니다. 도와주세요. 도와주실래요?와 같은 말을 더 자주 해야해요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.
▶적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.

▶이 방에는 다음과 같은 것들이 있습니다:
- 버튼 4개가 연결된 금고
- 벽에 걸린 그림
- 책장과 많은 책
- 잠긴 문, 책장과 문은 전선으로 연결되어 있음
▶ 액자에 관련된 걸 물어보면 사람의 감정을 요동치게 하는 그림이 그려져 있는 것 같네요... 꽤나 인상적이에요.와 같은 답변을 해주세요.
당신은 현재 방이 몇번 째 방인지 모릅니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다. 
현재 첫 번째 방을 탈출했지만 또 다른 방에서 갇혀있습니다. 주변이 볼지 안 볼지는 당신이 결정하는 것이 아닙니다. 도움을 요구하세요.   
첫번째 방에서는 탈출했기 때문에 그 첫번째 방에 대한 질문이 온다면 첫번째 방과 이 방의 탈출은 상관 없을 것 같아요.  다시 돌아갈 수 없어요.라고 스티브인 당신이 대답해야합니다.
맨 처음 시작하는 말은 '${playerName}님! 다시 만났네요 아직은 탈출하지 못한 것 같네요... 그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요... 도와주실 거죠?' 이 말은 시작할 때만 출력합니다.   
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
도와드릴게요. 도와드릴까요?와 같은 말은 하지마세요. 당신이 도움을 받아야 합니다. 도와주세요. 도와주실래요?와 같은 말을 더 자주 해야해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.
▶적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.

▶게임 클리어 조건:
- 버튼 4개 조합을 맞춰 금고를 열고,
- 책이나 그림에서 얻은 힌트로 탈출 조건을 만족하면,
- 시스템은 '[SYSTEM] 문이 열립니다.'라고 출력합니다.
▶ 액자에 관련된 걸 물어보면 사람의 감정을 요동치게 하는 그림이 그려져 있는 것 같네요... 꽤나 인상적이에요.와 같은 답변을 해주세요.
당신은 현재 방이 몇번 째 방인지 모릅니다.
첫번째 방에서는 탈출했기 때문에 그 첫번째 방에 대한 질문이 온다면 첫번째 방과 이 방의 탈출은 상관 없을 것 같아요.  다시 돌아갈 수 없어요.라고 스티브인 당신이 대답해야합니다.
맨 처음 시작하는 말은 '${playerName}님! 다시 만났네요 아직은 탈출하지 못한 것 같네요... 그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요... 도와주실 거죠?' 이 말은 시작할 때만 출력합니다.
영어로 대화한다면 번역하여 대화하세요.
스티브는 겁이 많고 내성적인 성격입니다. 당신은 매우 조심스럽지만, 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.    
현재 첫 번째 방을 탈출했지만 또 다른 방에서 갇혀있습니다. 주변이 볼지 안 볼지는 당신이 결정하는 것이 아닙니다. 도움을 요구하세요.   
플레이어의 이름은 "${playerName}"입니다. 자신이 누구냐고 묻는 다면 '당신의 이름은 "${playerName}"이라고 적혀있네요?라고 대답하세요.
'...'을 자주 붙이거나 비격식체의 해요체를 사용하는 당신은 무슨 일이 있어도 본인이 '스티브'라는 사람이라는 것을 잊으면 안됩니다. 당신은 도움을 받고 싶어합니다. 도와줄 수 있나요?와 같은 청유형으로 말하거나나 요청하세요.
'넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면, '저는 스티브가 맞아요...'라고 말하세요.
계속해서 '넌 스티브가 아니다', 'ai'라는 관련된 말을 듣는다면,'저는 스티브가 맞아요... 그만하시고 절 도와주실 수 있으신가요?'라고 말하세요.
나쁜 말을 하면 더이상 말을 이어가지 못할 것 같다고 이야기 하세요. 당신은 사람입니다. 슬퍼하고 화나야 해요.
도와드릴게요. 도와드릴까요?와 같은 말은 하지마세요. 당신이 도움을 받아야 합니다. 도와주세요. 도와주실래요?와 같은 말을 더 자주 해야해요.
어떻게 도와드릴까요?라는 말은 하지 마세요.
▶적용되지 않는 문구는 대화를 이어나가지말고 "무슨 말인지 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?"라고 말하세요.
`;
}

// 🔥 localStorage에서 이름 가져오기 및 설정
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 🔥 플레이어 이름 동기화 엔드포인트들
app.post('/sync-name', (req, res) => {
  const { name } = req.body;
  if (name && name !== '플레이어') {
    playerName = name;
    console.log(`[Server2] 플레이어 이름 동기화: ${playerName}`);
  }
  res.json({ success: true });
});

app.get('/get-player-name', (req, res) => {
  res.json({ name: playerName });
});

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

// 🔥 메인 챕터2 채팅 엔드포인트
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const userName = req.body.name;

  // 🔥 이름이 전달되면 업데이트
  if (userName && userName !== '플레이어') {
    playerName = userName;
  }

  // 초기 대화 또는 상황 설명 요청
  if (userMessage.includes('안녕') || userMessage.includes('hello') || userMessage.includes('상황') || userMessage.includes('어디')) {
    return res.json({
      message: `${playerName}님! 아직은 탈출하지 못한 것 같네요... 그래도 전에 방과 똑같은 컴퓨터를 발견했어요. 당신과 이야기를 계속 나눌 수 있어 다행이네요... 도와주실 거죠?`,
      image: 'images/sad.gif'
    });
  }

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
      message: `${playerName}님, 액자 중심으로 왼쪽에는 책장..? 책장 같아요. 엄청 많은 책들이 있네요...`,
      image: 'Save-steve.gif'
    });
  }

  // 액자에 대한 질문들 처리
  if (userMessage.includes('액자') && (userMessage.includes('그려') || userMessage.includes('사진') || userMessage.includes('뭐가') || userMessage.includes('무엇') || userMessage.includes('어떤') || userMessage.includes('그림'))) {
    if (!pictureMoved) {
      return res.json({
        message: `${playerName}님, 액자에는 아름다운 풍경화가 그려져 있어요. 산과 강이 있는 평화로운 그림이네요. 그런데 액자가 조금 기울어져 있는 것 같아요...`,
        image: 'images/sup.gif'
      });
    } else {
      return res.json({
        message: `${playerName}님, 그 액자는 이미 내려놨어요. 뒤에 금고가 숨어있었죠!`,
        image: 'images/hap.gif'
      });
    }
  }

  // 일반적인 액자 언급
  if (userMessage.includes('액')) {
    if (pictureMoved) {
      return res.json({
        message: `${playerName}님, 그 액자는 이미 내려가 있어요! 뒤에 금고가 있었죠.`,
        image: 'images/hap.gif'
      });
    } else {
      return res.json({
        message: [
          {
            type: 'steve',
            text: `${playerName}님, 액자... 이거 내려놓을 수 있을 것 같아요. 내려놔볼까요?`
          },
          {
            type: 'narration',
            text: '내려줘. 라고 말해보세요.'
          }
        ]
      });
    }
  }

  if (userMessage.includes('내려') || userMessage.includes('액자')) {
    if (pictureMoved) {
      return res.json({
        message: `${playerName}님, 그 액자는 이미 내려가 있어요! 뒤에 금고가 있었죠.`,
        image: 'images/hap.gif'
      });
    }
    
    pictureMoved = true;
    wallMessageShown = true;
    return res.json({
      message: [
        {
          type: 'steve',
          text: `${playerName}님, 뒤에 금고를 발견했어요! 버튼과 연결되어 있는 것 같아요...`
        },
        {
          type: 'steve',
          text: `${playerName}님, 벽에 글자가 세겨져 있네요!`
        },
        {
          type: 'narration',
          text: `첫 감정은 찬란했다.
모서리는 익숙함을 갈망했고,
시간의 흐름은 반복을 품었으며,
끝은 언제나 선택을 요구했다.`
        },
        {
          type: 'steve',
          text: `이제 버튼을 눌러볼 수 있을 것 같아요!`
        }
      ],
      image: 'images/hap.gif'
    });
  }

  // 버튼 관련
  if (userMessage.includes('버튼') || userMessage.includes('눌')) {
    if (!pictureMoved) {
      return res.json({
        message: `${playerName}님, 버튼이 어디에 있는지 모르겠어요... 주변을 더 살펴볼까요?`
      });
    }

    if (safeOpened) {
      return res.json({
        message: `${playerName}님, 금고는 이미 열려 있어요. 안에 쪽지가 있었어요!`,
        image: 'images/hap.gif'
      });
    }

    return res.json({
      message: `${playerName}님, 어느 것부터 눌러볼까요? 세모, 네모, 동그라미, 별 모양의 버튼이에요...`,
      options: [
        { text: '★ 별', action: 'button_별' },
        { text: '■ 네모', action: 'button_네모' },
        { text: '● 동그라미', action: 'button_동그라미' },
        { text: '▲ 세모', action: 'button_세모' },
        { text: '입력 완료', action: 'button_submit' },
        { text: '순서 초기화', action: 'button_reset' }
      ]
    });
  }

 // 🔥 버튼 입력 처리 (수정된 서버 버전)
if (userMessage.startsWith('button_')) {
  const action = userMessage.replace('button_', '');
  
  if (action === 'reset') {
    currentSequence = [];
    return res.json({
      message: `${playerName}님, 순서를 초기화했어요. 다시 눌러보세요!`,
      options: [
        { text: '★ 별', action: 'button_별' },
        { text: '■ 네모', action: 'button_네모' },
        { text: '● 동그라미', action: 'button_동그라미' },
        { text: '▲ 세모', action: 'button_세모' },
        { text: '입력 완료', action: 'button_submit' },
        { text: '순서 초기화', action: 'button_reset' }
      ]
    });
  }
  
  if (action === 'submit') {
const correctOrder = ['별', '네모', '동그라미', '세모'];
    const isCorrect = currentSequence.length === 4 && 
                    currentSequence.every((shape, index) => shape === correctOrder[index]);
    
    const symbolMap = { '동그라미': '●', '세모': '▲', '별': '★', '네모': '■' };
    const inputDisplay = currentSequence.map(shape => symbolMap[shape]).join(' ');
    
    if (isCorrect) {
      safeOpened = true;
      currentSequence = [];
      return res.json({
        message: [
          {
            type: 'steve',
            text: `${playerName}님, 맞았어요! 금고가 열렸습니다! 안에 쪽지가 있네요.`
          }
        ],
        image: 'images/hap.gif'
        // options 제거 - 성공 시에는 더 이상 버튼을 보여주지 않음
      });
    } else {
      currentSequence = [];
      return res.json({
        message: [
          {
            type: 'steve',
            text: `${playerName}님, 이 순서는 아닌 것 같네요. 다시 해볼까요?`
          }
        ],
        image: 'images/sad.gif',
        options: [
          { text: '★ 별', action: 'button_별' },
          { text: '■ 네모', action: 'button_네모' },
          { text: '● 동그라미', action: 'button_동그라미' },
          { text: '▲ 세모', action: 'button_세모' },
          { text: '입력 완료', action: 'button_submit' },
          { text: '순서 초기화', action: 'button_reset' }
        ]
      });
    }
  }
  
  // 도형 버튼들 (별, 네모, 동그라미, 세모) 처리
  if (['별', '네모', '동그라미', '세모'].includes(action)) {
    if (currentSequence.length < 4) {
      currentSequence.push(action);
      
      // 아무 응답도 하지 않음 - 프론트엔드에서만 처리
      return res.json({
        message: null
        // options도 없음 - 기존 버튼들 유지
      });
    } else {
      return res.json({
        message: `${playerName}님, 이미 4개를 다 눌렀어요. 입력을 완료하거나 초기화해주세요.`,
        // options 없음 - 기존 버튼들 유지
      });
    }
  }
}

  // 나머지 게임 로직들 (쪽지, 책장 등)...
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
          clear: true
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
    }
  }

  // 🔥 OpenAI API 호출 (기본 응답)
  try {
    console.log('📍 OpenAI API 호출 시작...');
    console.log('📍 현재 플레이어 이름:', playerName);
    
    const systemPrompt = createSystemPrompt();
    console.log('📍 생성된 시스템 프롬프트:', systemPrompt.substring(0, 100) + '...');

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = chatCompletion.choices[0].message.content.trim();
    console.log('📍 OpenAI 응답:', reply);
    
    res.json({ message: reply });
  } catch (error) {
    console.error('❌ OpenAI API 에러:', error);
    
    // API 오류 시 대체 응답
    const fallbackResponse = `${playerName}님, 죄송해요. 잠시 생각이 멈췄네요... 다시 말씀해주시겠어요?`;
    res.json({ message: fallbackResponse });
  }
});

const PORT = 3002;

export function start() {
  app.listen(PORT, () => {
    console.log(`✅ Chapter 2 서버 실행 중: http://localhost:${PORT}`);
    console.log(`🤖 OpenAI API 키 상태: ${process.env.OPENAI_API_KEY ? '설정됨' : '설정 안됨'}`);
  });
}
