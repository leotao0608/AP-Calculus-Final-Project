// maze.js

let mapData     = null;
let TILE        = 40;
let COLS        = 0;
let ROWS        = 0;
let player      = { x: 1, y: 1 };
let unlockedCells = new Set(); 
let mapDifficulty = 1;
let questions = [];

// ── load map from json ──────────────────────────────
async function loadMap(levelNum) {
  const res  = await fetch(`maps/level${levelNum}.json`);
  const data = await res.json();

  mapData       = data.grid;
  TILE          = data.tileSize;
  COLS          = data.cols;
  ROWS          = data.rows;
  player        = { ...data.start };
  mapDifficulty = data.difficulty;
  const qRes  = await fetch(`questions/difficulty${mapDifficulty}.json`);
  questions   = await qRes.json();
  initMaze();
}

// ── initialise canvas ─────────────────────────────────
function initMaze() {
  const canvas  = document.getElementById('maze-canvas');
  canvas.width  = COLS * TILE;
  canvas.height = ROWS * TILE;
  drawMaze();
}

// ── draw map ────────────────────────────────────────
function drawMaze() {
  const canvas = document.getElementById('maze-canvas');
  const ctx    = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = mapData[row][col];
      const key  = `${col},${row}`;
      const x    = col * TILE;
      const y    = row * TILE;

      if (tile === 1) {
        // wall
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, TILE, TILE);

      } else if (tile === 2) {
        // end
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        ctx.fillStyle    = '#fff';
        ctx.font         = `${TILE * 0.5}px monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x + TILE / 2, y + TILE / 2);

      } else if (tile === 3) {
        if (unlockedCells.has(key)) {
            //cells unlocked
          ctx.fillStyle = '#000';
          ctx.fillRect(x, y, TILE, TILE);
        } else {
          const pad = 4;
          const depth = 4;
          
          ctx.fillStyle = '#FFD600';
          ctx.fillRect(x + pad, y + pad, TILE - pad * 2, TILE - pad * 2);

          ctx.fillStyle    = '#000';
          ctx.font         = `bold ${TILE * 0.4}px monospace`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', x + TILE / 2 - 1, y + TILE / 2 - 1);
        }

      } else {
        // cells
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }

  // player, cirle for now
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(
    player.x * TILE + TILE / 2,
    player.y * TILE + TILE / 2,
    TILE * 0.3, 0, Math.PI * 2
  );
  ctx.fill();
}

// ── move player ──────────────────────────────────────
function movePlayer(nx, ny) {
  player.x = nx;
  player.y = ny;
  // mark as unlocked
  const key = `${nx},${ny}`;
  if (mapData[ny][nx] === 3) {
    unlockedCells.add(key);
  }
  drawMaze();
}

// ── reset player to beginning ────────────────────────────────
function resetPlayer(startX, startY) {
  player.x      = startX ?? 1;
  player.y      = startY ?? 1;
  unlockedCells = new Set();
  drawMaze();
}

// ── key listener ──────────────────────────────────────
const DIRS = {
  ArrowUp:    { dx:  0, dy: -1 },
  ArrowDown:  { dx:  0, dy:  1 },
  ArrowLeft:  { dx: -1, dy:  0 },
  ArrowRight: { dx:  1, dy:  0 },
  w:          { dx:  0, dy: -1 },
  s:          { dx:  0, dy:  1 },
  a:          { dx: -1, dy:  0 },
  d:          { dx:  1, dy:  0 },
};

document.addEventListener('keydown', (e) => {
    if (!document.getElementById('screen-game').classList.contains('active')) return;
  const dir = DIRS[e.key];
  if (!dir) return;
  e.preventDefault();

  if (!document.getElementById('screen-game').classList.contains('active')) return;
  if (isQuestionOpen()) return;
  if (!mapData) return;

  const nx  = player.x + dir.dx;
  const ny  = player.y + dir.dy;
  const key = `${nx},${ny}`;

  // hit wall
  if (mapData[ny][nx] === 1) return;

  // end
  if (mapData[ny][nx] === 2) {
    if (isMoving) return;
    isMoving = true;
    movePlayer(nx, ny);
    setTimeout(() => levelComplete(), 300);
    return;
  }
  //unlock question
  if (mapData[ny][nx] === 3 && !unlockedCells.has(key)) {
    triggerQuestion(nx, ny);
    return;
  }

  movePlayer(nx, ny);
});
