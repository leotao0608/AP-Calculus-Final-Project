// game.js

let currentQuestion = null;
let pendingMove     = null;
let currentLevel    = 1;
let hp              = 3;
let score           = 0;
let isMoving        = false;

const levels = [
  { num: 1, name: 'Level 1', difficulty: 'Difficulty: ★' },
  { num: 2, name: 'Level 2', difficulty: 'Difficulty: ★★' },
];

function showLevelSelect() {
  const list = document.getElementById('level-list');
  list.innerHTML = '';
  levels.forEach(lv => {
    const btn = document.createElement('button');
    btn.className   = 'btn-primary';
    btn.innerHTML   = `${lv.name} <span style="font-weight:normal;font-size:0.8rem">${lv.difficulty}</span>`;
    btn.onclick     = () => startGame(lv.num);
    list.appendChild(btn);
  });
  showScreen('screen-levelselect');
}


function triggerQuestion(nx, ny) {
  if (isMoving) return;
  isMoving    = true;
  pendingMove = { nx, ny };

  const pool = questions.filter(q => q.difficulty === mapDifficulty);
  const idx  = Math.floor(Math.random() * pool.length);
  currentQuestion = pool[idx];

  renderQuestion();
  document.getElementById('question-card').classList.add('open');
}

function isQuestionOpen() {
  return document.getElementById('question-card').classList.contains('open');
}

function renderQuestion() {
  document.getElementById('hud-topic').textContent = currentQuestion.topic.toUpperCase();
  document.getElementById('q-meta').textContent =
    `Topic: ${currentQuestion.topic}  |  Difficulty: ${'★'.repeat(currentQuestion.difficulty)}`;

  document.getElementById('q-text').innerHTML = `\\(${currentQuestion.latex}\\)`;
  MathJax.typesetPromise([document.getElementById('q-text')]);

  const optionsEl = document.getElementById('q-options');
  optionsEl.innerHTML = '';
  currentQuestion.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `\\(${opt}\\)`;
    btn.onclick = () => selectAnswer(i);
    optionsEl.appendChild(btn);
  });
  MathJax.typesetPromise([optionsEl]);

  document.getElementById('q-feedback').textContent = '';
  document.getElementById('btn-next').style.display = 'none';
}

async function selectAnswer(index) {
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(b => b.disabled = true);

  if (index === currentQuestion.answerIndex) {
    buttons[index].classList.add('correct');
    document.getElementById('q-feedback').textContent = '✓ Correct!';
    score += 10;
    document.getElementById('hud-score').textContent = `SCORE: ${score}`;
    
    document.getElementById('btn-next').textContent = 'CONFIRM →';
  } else {
    buttons[index].classList.add('wrong');
    buttons[currentQuestion.answerIndex].classList.add('correct');
    document.getElementById('q-feedback').textContent = '✗ Wrong. You stay.';
    hp--;
    document.getElementById('hud-hp').textContent = `HP: ${hp}`;
    pendingMove = null; 
    document.getElementById('btn-next').textContent = 'CLOSE';
    if (hp <= 0) {
        await deleteSave();
        setTimeout(() => { alert('Game Over!'); resetGame(); }, 500);
        return;
    }
  }

  document.getElementById('btn-next').style.display = 'block';
}

function nextQuestion() {
  document.getElementById('question-card').classList.remove('open');
  isMoving = false;

  if (pendingMove) {
    movePlayer(pendingMove.nx, pendingMove.ny);
    pendingMove = null;
  }
}

async function startGame(levelNum = 1) {
  currentLevel  = levelNum;
  unlockedCells = new Set();
  showScreen('screen-game');
  hp       = 3;
  score    = 0;
  isMoving = false;
  document.getElementById('hud-hp').textContent    = 'HP: 3';
  document.getElementById('hud-score').textContent = 'SCORE: 0';
  document.getElementById('question-card').classList.remove('open');
  await loadMap(currentLevel);
}

async function resetGame() {
    unlockedCells = new Set();
    hp           = 3;
    score        = 0;
    currentLevel = 1;
    isMoving     = false;
    document.getElementById('hud-hp').textContent    = 'HP: 3';
    document.getElementById('hud-score').textContent = 'SCORE: 0';
    document.getElementById('question-card').classList.remove('open');
    await loadMap(currentLevel);
}

async function continueGame() {
  showScreen('screen-game');
  isMoving = false;
  document.getElementById('question-card').classList.remove('open');
  const loaded = await loadProgress();
  if (!loaded) {
    
    currentLevel = 1;
    await startGame();
  }
}

async function levelComplete() {
  currentLevel++;
  const res = await fetch(`maps/level${currentLevel}.json`);
  if (res.ok) {
    await loadMap(currentLevel);
  } else {
    await deleteSave(); 
    alert('You finished all levels!');
    currentLevel = 1;
    showScreen('screen-menu');
  }
}
