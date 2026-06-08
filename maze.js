// maze.js

let mapData     = null;
let TILE        = 40;
let COLS        = 0;
let ROWS        = 0;
let player      = { x: 1, y: 1 };
let unlockedCells = new Set(); 
let mapDifficulty = 1;
let questions = [];

const levelSizes = {
  1:  11,
  2:  13,
  3:  15,
  4:  17,
  5:  19,
  6:  21,
  7:  23,
  8:  25,
  9:  27,
  10: 29,
};

// ── load map from json ──────────────────────────────
async function loadMap(levelNum) {
  const res  = await fetch(`maps/level${levelNum}.json`);
  const data = await res.json();

  TILE          = data.tileSize;
  const size = levelSizes[levelNum] || 11;
  COLS = size;
  ROWS = size;
  mapDifficulty = data.difficulty;

  mapData = generateMaze(COLS, ROWS, data.start);
  player  = { ...data.start };

  const qRes = await fetch(`questions/difficulty${mapDifficulty}.json`);
  questions  = await qRes.json();

  initMaze();
}
//--- Generate Map-------------------------------------
function generateMaze(cols, rows, start) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));

  function carve(x, y) {
    const dirs = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 1) {
        grid[y + dy / 2][x + dx / 2] = 0;
        grid[ny][nx] = 0;
        carve(nx, ny);
      }
    }
  }

  grid[start.y][start.x] = 0;
  carve(start.x, start.y);

  // add extra junctions
  const junctionCount = Math.floor(Math.min(cols, rows) / 4);
  for (let i = 0; i < junctionCount; i++) {
    const r = (Math.floor(Math.random() * ((rows - 3) / 2)) * 2) + 2;
    const c = (Math.floor(Math.random() * ((cols - 3) / 2)) * 2) + 2;
    if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1 && grid[r][c] === 1) {
      const horizontal = grid[r][c - 1] === 0 && grid[r][c + 1] === 0;
      const vertical   = grid[r - 1][c] === 0 && grid[r + 1][c] === 0;
      if (!horizontal && !vertical) continue;

      // check no 2x2 blank would be created
      const wouldCreate2x2 = (
        (grid[r-1][c-1] === 0 && grid[r-1][c] === 0 && grid[r][c-1] === 0) ||
        (grid[r-1][c+1] === 0 && grid[r-1][c] === 0 && grid[r][c+1] === 0) ||
        (grid[r+1][c-1] === 0 && grid[r+1][c] === 0 && grid[r][c-1] === 0) ||
        (grid[r+1][c+1] === 0 && grid[r+1][c] === 0 && grid[r][c+1] === 0)
      );

      if (!wouldCreate2x2) {
        grid[r][c] = 0;
      }
    }
  }


  // exit fixed at bottom-right on valid odd coordinate
  const exitX = cols % 2 === 0 ? cols - 3 : cols - 2;
  const exitY = rows % 2 === 0 ? rows - 3 : rows - 2;
  grid[exitY][exitX] = 2;

  // collect all open path cells
  const pathCells = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (
        r % 2 === 1 && c % 2 === 1 && // only odd coordinates (maze nodes)
        grid[r][c] === 0 &&
        !(c === start.x && r === start.y) &&
        !(c === exitX && r === exitY)
      ) {
        pathCells.push({ x: c, y: r });
      }
    }
  }

  // shuffle path cells
  pathCells.sort(() => Math.random() - 0.5);

  // place question cells with minimum distance between them
  const minDist = 3;
  const placed_cells = [];
  const questionCount = Math.max(
    Math.floor(pathCells.length * 0.4), // 2% of path cells
    1
  );

  for (const cell of pathCells) {
    if (placed_cells.length >= questionCount) break;
    const tooClose = placed_cells.some(
      p => Math.abs(p.x - cell.x) + Math.abs(p.y - cell.y) < minDist
    );
    if (!tooClose) {
      grid[cell.y][cell.x] = 3;
      placed_cells.push(cell);
    }
  }

  // guarantee at least one question cell on every possible path to exit
  // by placing one question on the cell adjacent to exit
  const exitNeighbors = [
    { x: exitX - 2, y: exitY },
    { x: exitX, y: exitY - 2 },
  ];
  for (const n of exitNeighbors) {
    if (n.x > 0 && n.y > 0 && grid[n.y][n.x] === 0) {
      grid[n.y][n.x] = 3;
      break;
    }
  }
  return grid;
}
//---Load Saved Map------------------------------------
async function loadMapConfig(levelNum) {
  const res  = await fetch(`maps/level${levelNum}.json`);
  const data = await res.json();
  TILE          = data.tileSize;
  const size = levelSizes[currentLevel] || 11;
  COLS = size;
  ROWS = size;
  mapDifficulty = data.difficulty;

  const qRes = await fetch(`questions/difficulty${mapDifficulty}.json`);
  questions  = await qRes.json();

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
    setTimeout(() => {
      const card = document.getElementById('confirm-card');
      document.getElementById('confirm-message').textContent = 'Do you want to exit?';
      card.classList.add('open');

      document.getElementById('confirm-yes').onclick = () => {
        card.classList.remove('open');
        levelComplete();
      };
      document.getElementById('confirm-no').onclick = () => {
        card.classList.remove('open');
        isMoving = false;
      };
    }, 300);
    return;
  }
  //unlock question
  if (mapData[ny][nx] === 3 && !unlockedCells.has(key)) {
    triggerQuestion(nx, ny);
    return;
  }

  movePlayer(nx, ny);
});
