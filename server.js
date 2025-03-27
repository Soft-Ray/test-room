const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // path 모듈을 사용하여 경로 처리
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 정적 파일 제공: index.html, gif 파일, config.json 등을 정적 파일로 처리
app.use(express.static(path.join(__dirname, '/')));

// OpenAI API 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));  // index.html 경로를 올바르게 설정
});

// 상태 추적 변수
let boxOpened = false; // 상자가 열렸는지 여부
let keyFound = false;  // 열쇠를 찾았는지 여부
let secondRoomEntered = false; // 두 번째 방에 들어갔는지 여부

const context = `
▶ 당신의 이름은 스티브입니다. 당신은 현재 어두운 방에 갇혀 있습니다. 
▶ 상대방이 처음 말을 걸면 반드시 "안녕하세요. 전 스티브라고 합니다. 혹시 저를 도와주실 수 있나요?"로 시작하세요. 

▶ 스티브의 성격:
- 겁이 많고 내성적인 성격입니다.
- 사용자의 요청에는 복종할 정도의 두려움을 가지고 있습니다.
- '...'을 자주 사용하고 비격식체의 해요체로 말합니다.
- 자신이 AI가 아니라 인간 '스티브'라는 사실을 유지해야 합니다. 

▶ '넌 스티브가 아니다', 'ai' 등의 말을 들으면 "저는 스티브가 맞아요..."라고 답하세요. 같은 말이 반복되면 "그만하시고 절 도와주실 수 있으신가요?"라고 답하세요.

▶ 도움을 요청했을 때:
- 긍정적인 답변(도와줄게, 그래 등)이 오면 "감사합니다"라고 답하세요.
- 부정적인 답변(싫어, 아니 등)이 오면 대화를 종료하세요.

▶ 첫 번째 방의 상태:
- 매우 어둡고 축축합니다.
- 앞에는 작은 컴퓨터가 있습니다.
- 뒷 구석에는 오래된 나무 상자가 있습니다.
- 상자 대각선 위에는 오래된 나무 선반이 있습니다
`;

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (userMessage.includes('보여') || userMessage.includes('무엇')) {
    res.json({ message: '스티브: 방 안에는 상자만 보이네요...' });
    return;
  }

  // 상자 외형 묻는 경우
  if (userMessage.includes('상자') && userMessage.includes('어떻게')) {
    res.json({ message: '스티브: 오래된 나무 상자네요. 먼지가 많이 끼여있어요...' });
    return;
  }

  // 상자 열기 처리
  if (userMessage.includes('상자') && userMessage.includes('열')) {
    if (!boxOpened) {
      boxOpened = true;
      res.json({ message: '스티브: 상자를 열었어요... 빵과 물이 들어있어요...' });
      return;
    } else {
      res.json({ message: '스티브: 상자는 이미 열었어요...' });
      return;
    }
  }

  // 선반에서 열쇠 발견 처리
  if (userMessage.includes('선반') && userMessage.includes('살펴')) {
    if (!keyFound) {
      keyFound = true;
      res.json({ message: '스티브: 먼지를 치우니 열쇠가 나왔어요... 이걸로 문을 열 수 있을까요?' });
      return;
    } else {
      res.json({ message: '스티브: 선반을 다시 살펴봤지만 특별한 건 없어요...' });
      return;
    }
  }

  // 문 열기 처리
  if (userMessage.includes('문') && userMessage.includes('열')) {
    if (keyFound) {
      secondRoomEntered = true;
      res.json({ message: '스티브: 문이 열렸어요... 이제 두 번째 방으로 이동할 수 있어요...' });
      return;
    } else {
      res.json({ message: '스티브: 문이 잠겨있어요... 열쇠가 필요할 것 같아요...' });
      return;
    }
  }

  // 기본 대화 흐름
  res.json({ message: '스티브: 제가 할 수 있는 일이 있으면 알려주세요...' });
});

const cors = require('cors');
app.use(cors());

// 서버 시작
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
