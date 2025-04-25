// main.js
import express from 'express';
import chapter1Router from './chapter1/server1.js';
import chapter2Router from './chapter2/server2.js';
import chapter3Router from './chapter3/server3.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 각 챕터를 라우터로 분기
app.use('/chapter1', chapter1Router);
app.use('/chapter2', chapter2Router);
app.use('/chapter3', chapter3Router);

app.get('/', (req, res) => {
  res.sendFile('index0.html', { root: './public' });
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Main server running on port ${PORT}`);
});
