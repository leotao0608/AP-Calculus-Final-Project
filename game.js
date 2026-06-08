// game.js

let currentQuestion = null;
let pendingMove     = null;
let currentLevel    = 1;
let hp              = 3;
let score           = 0;
let isMoving        = false;
let usedQuestionIds = new Set();
let passedLevels = new Set();
let fromContinue = false;

const levels = [
  { num: 1, name: 'Level 1', difficulty: 'Difficulty: ★' },
  { num: 2, name: 'Level 2', difficulty: 'Difficulty: ★★' },
  { num: 3, name: 'Level 3', difficulty: 'Difficulty: ★★★' },
];

// ── auto save timer ───────────────────────────────────
function startAutoSave() {
  if (window.autoSaveTimer) clearInterval(window.autoSaveTimer);
  window.autoSaveTimer = setInterval(() => saveProgress(), 30000);
}

function stopAutoSave() {
  if (window.autoSaveTimer) {
    clearInterval(window.autoSaveTimer);
    window.autoSaveTimer = null;
  }
}

function showLevelSelect() {
  const list = document.getElementById('level-list');
  list.innerHTML = '';
  levels.forEach(lv => {
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    const isLocked = lv.num > 1 && !passedLevels.has(lv.num - 1);
    if (isLocked) {
      btn.innerHTML = `${lv.name} <span style="font-weight:normal;font-size:0.8rem">🔒</span>`;
      btn.disabled = true;
      btn.style.opacity = '0.4';
    } else {
      const passed = passedLevels.has(lv.num);
      btn.innerHTML = `${lv.name} <span style="font-weight:normal;font-size:0.8rem">${lv.difficulty}</span>${passed ? ' <span style="color:green">Passed</span>' : ''}`;
      btn.onclick = () => {
        checkSaveExists().then(hasSave => {
          const card = document.getElementById('confirm-card');
          document.getElementById('confirm-message').textContent = hasSave
            ? 'Start a new game? This will overwrite your existing save.'
            : 'Start Level ' + lv.num + '?';
          card.classList.add('open');

          document.getElementById('confirm-yes').onclick = () => {
            card.classList.remove('open');
            startGame(lv.num);
          };
          document.getElementById('confirm-no').onclick = () => {
            card.classList.remove('open');
          };
        });
      };
    }
    list.appendChild(btn);
  });
  showScreen('screen-levelselect');
}

function isQuestionOpen() {
  return document.getElementById('question-card').classList.contains('open')
      || document.getElementById('confirm-card').classList.contains('open');
}

// ── cheat code: left→right = auto correct, right→left = auto wrong ──
let cheatSequence = [];

function cheatClick(side) {
  if (document.getElementById('btn-next').style.display !== 'none') return;
  const now = Date.now();
  if (cheatSequence.length === 0) {
    cheatSequence = [{ side, time: now }];
    return;
  }
  const first = cheatSequence[0];
  if (now - first.time > 2000) {
    cheatSequence = [{ side, time: now }];
    return;
  }
  if (side === first.side) {
    cheatSequence = [{ side, time: now }];
    return;
  }
  cheatSequence = [];
  if (first.side === 'left' && side === 'right') {
    selectAnswer(currentQuestion.answerIndex);
  } else if (first.side === 'right' && side === 'left') {
    const wrongIndex = currentQuestion.options.findIndex((_, i) => i !== currentQuestion.answerIndex);
    selectAnswer(wrongIndex);
  }
}

function renderQuestion() {
  cheatSequence = [];
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
      stopAutoSave();
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
  stopAutoSave();
  await deleteSave();
  fromContinue    = false;
  currentLevel    = levelNum;
  unlockedCells   = new Set();
  usedQuestionIds = new Set();
  hp              = 3;
  score           = 0;
  isMoving        = false;
  showScreen('screen-game');
  document.getElementById('hud-hp').textContent    = 'HP: 3';
  document.getElementById('hud-score').textContent = 'SCORE: 0';
  document.getElementById('question-card').classList.remove('open');
  document.getElementById('hud-topic').textContent = `LEVEL ${currentLevel}`;

  await loadMap(currentLevel);
  await saveProgress();
  startAutoSave();
}

async function resetGame(level) {
  stopAutoSave();
  unlockedCells   = new Set();
  usedQuestionIds = new Set();
  hp              = 3;
  score           = 0;
  currentLevel    = level;
  isMoving        = false;
  document.getElementById('hud-hp').textContent    = 'HP: 3';
  document.getElementById('hud-score').textContent = 'SCORE: 0';
  document.getElementById('question-card').classList.remove('open');
  document.getElementById('hud-topic').textContent = `LEVEL ${level}`;

  await loadMap(level);
  await saveProgress();
  startAutoSave();
}

async function continueGame() {
  fromContinue = true;
  showScreen('screen-game');
  isMoving = false;
  document.getElementById('question-card').classList.remove('open');
  const loaded = await loadProgress();
  if (!loaded) {
    currentLevel = 1;
    await startGame();
  } else {
    document.getElementById('hud-topic').textContent = `LEVEL ${currentLevel}`;
    startAutoSave();
  }
}

async function levelComplete() {
  stopAutoSave();
  const nextLevel = levels.find(lv => lv.num === currentLevel + 1);

  if (nextLevel) {
    passedLevels.add(currentLevel);
    await savePassedLevels();
    await deleteSave();
    currentLevel++;
    await new Promise(resolve => {
      const card = document.getElementById('pass-card');
      card.classList.add('open');
      setTimeout(() => {
        card.classList.remove('open');
        resolve();
      }, 1500);
    });
    await onLoginSuccess(auth.currentUser);
  } else {
    await deleteSave();
    passedLevels.add(currentLevel);
    currentLevel = 1;
    await savePassedLevels();
    await new Promise(resolve => {
      const card = document.getElementById('pass-card');
      card.classList.add('open');
      setTimeout(() => {
        card.classList.remove('open');
        resolve();
      }, 1500);
    });
    await onLoginSuccess(auth.currentUser);
  }
}

function exitGame() {
  const card = document.getElementById('confirm-card');
  document.getElementById('confirm-message').textContent = 'Are you sure to quit this game?';
  card.classList.add('open');

  document.getElementById('confirm-yes').onclick = async () => {
    card.classList.remove('open');
    stopAutoSave();
    await saveProgress();
    if (fromContinue) {
      showScreen('screen-menu');
    } else {
      showLevelSelect();
    }
  };

  document.getElementById('confirm-no').onclick = () => {
    card.classList.remove('open');
  };
}

function triggerQuestion(nx, ny) {
  if (isMoving) return;
  isMoving    = true;
  pendingMove = { nx, ny };
  const pool = questions.filter(q => !usedQuestionIds.has(q.id));
  if (pool.length === 0) {
    isMoving = false;
    movePlayer(nx, ny);
    pendingMove = null;
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  currentQuestion = pool[idx];
  usedQuestionIds.add(currentQuestion.id);

  const alertCard = document.getElementById('alert-card');
  alertCard.classList.add('open');

  setTimeout(() => {
    alertCard.classList.remove('open');
    renderQuestion();
    document.getElementById('question-card').classList.add('open');
  }, 1000);
}