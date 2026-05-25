// game.js

let currentQuestion = null;
let pendingMove     = null;
let currentLevel    = 1;
let hp              = 3;
let score           = 0;
let isMoving        = false;
let usedQuestionIds = new Set();

const levels = [
  { num: 1, name: 'Level 1', difficulty: 'Difficulty: ★' },
  { num: 2, name: 'Level 2', difficulty: 'Difficulty: ★★' },
  { num: 3, name: 'Level 3', difficulty: 'Difficulty: ★★★' },
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



function isQuestionOpen() {
  return document.getElementById('question-card').classList.contains('open');
}

function renderQuestion() {
  document.getElementById('q-meta').textContent =
    `Topic: ${currentQuestion.topic}  |  Difficulty: ${'★'.repeat(currentQuestion.difficulty)}`;

  document.getElementById('q-text').innerHTML = `\\(${currentQuestion.latex}\\)`;
  MathJax.typesetPromise([document.getElementById('q-text')]);

  const optionsEl = document.getElementById('q-options');
  optionsEl.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];
currentQuestion.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `${labels[i]}. \\(${opt}\\)`;
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

    saveMistake(currentQuestion, index);

    if (hp <= 0) {
        await deleteSave();
        setTimeout(() => { alert('Game Over!'); resetGame(currentLevel); }, 500);
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
  usedQuestionIds = new Set();
  showScreen('screen-game');
  hp       = 3;
  score    = 0;
  isMoving = false;
  document.getElementById('hud-hp').textContent    = 'HP: 3';
  document.getElementById('hud-score').textContent = 'SCORE: 0';
  document.getElementById('question-card').classList.remove('open');
  
  document.getElementById('hud-topic').textContent = `LEVEL ${currentLevel}`;
  await loadMap(currentLevel);
}

async function resetGame(level) {
    unlockedCells = new Set();
    usedQuestionIds = new Set();
    hp           = 3;
    score        = 0;
    currentLevel = level;
    isMoving     = false;
    document.getElementById('hud-hp').textContent    = 'HP: 3';
    document.getElementById('hud-score').textContent = 'SCORE: 0';
    document.getElementById('question-card').classList.remove('open');
    document.getElementById('hud-topic').textContent = `LEVEL ${level}`;
    await loadMap(level);
}

async function continueGame() {
  showScreen('screen-game');
  isMoving = false;
  document.getElementById('question-card').classList.remove('open');
  const loaded = await loadProgress();
  if (!loaded) {
    currentLevel = 1;
    await startGame();
  }else {
    document.getElementById('hud-topic').textContent = `LEVEL ${currentLevel}`;
  }
}

async function levelComplete() {
  const nextLevel = levels.find(lv => lv.num === currentLevel + 1);

  if (nextLevel) {
    currentLevel++;
    await onLoginSuccess(auth.currentUser);
  } else {
    await deleteSave();
    currentLevel = 1;
    await onLoginSuccess(auth.currentUser);
  }
  alert('🎉 You passed!');
}

function triggerQuestion(nx, ny) {
  if (isMoving) return;
  isMoving    = true;
  pendingMove = { nx, ny };

  const pool = questions.filter(q => q.difficulty === mapDifficulty && !usedQuestionIds.has(q.id));
  if (pool.length === 0) return; // run out of questions
  const idx = Math.floor(Math.random() * pool.length);
  currentQuestion = pool[idx];
  usedQuestionIds.add(currentQuestion.id);

  const alert = document.getElementById('alert-card');
  alert.classList.add('open');

  setTimeout(() => {
    alert.classList.remove('open');
    renderQuestion();
    document.getElementById('question-card').classList.add('open');
  }, 1000);
}