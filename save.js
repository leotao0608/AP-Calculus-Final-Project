// save.js

async function saveProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const data = {
    level:         currentLevel,
    hp:            hp,
    score:         score,
    playerX:       player.x,
    playerY:       player.y,
    unlocked:      Array.from(unlockedCells), 
    usedQuestions: Array.from(usedQuestionIds),
    savedAt:       firebase.firestore.FieldValue.serverTimestamp(),
    mapGrid: mapData.map(row => row.join(',')),
  };

  try {
    await db.collection('progress').doc(user.uid).set(data);
    showSaveStatus('Auto-saved');
  } catch (e) {
    showSaveStatus('Auto-save failed');
    console.error(e);
  }
}

async function loadProgress() {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const doc = await db.collection('progress').doc(user.uid).get();
    if (!doc.exists) return false;

    const data    = doc.data();
    currentLevel  = data.level;
    hp            = data.hp;
    score         = data.score;
    unlockedCells = new Set(data.unlocked);
    usedQuestionIds = new Set(data.usedQuestions || []);

    document.getElementById('hud-hp').textContent    = `HP: ${hp}`;
    document.getElementById('hud-score').textContent = `SCORE: ${score}`;

    if (data.mapGrid) {
      mapData = data.mapGrid.map(row => row.split(',').map(Number));
      await loadMapConfig(currentLevel);
      initMaze();
    } else {
      await loadMap(currentLevel); // fallback
      player.x = data.playerX;
      player.y = data.playerY;
      drawMaze();
      return true;
    }
    player.x = data.playerX;
    player.y = data.playerY;
    drawMaze();
    return true;
    
  } catch (e) {
    console.error(e);
    return false;
  }
}

function showSaveStatus(msg) {
  const el = document.getElementById('save-status');
  el.textContent = msg;
  setTimeout(() => el.textContent = '', 1500);
}
async function checkSaveExists() {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const doc = await db.collection('progress').doc(user.uid).get();
    return doc.exists;
  } catch (e) {
    return false;
  }
}

async function deleteSave() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection('progress').doc(user.uid).delete();
  } catch (e) {
    console.error(e);
  }
}

async function savePassedLevels() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection('passed').doc(user.uid).set({
      passed: Array.from(passedLevels)
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadPassedLevels() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const doc = await db.collection('passed').doc(user.uid).get();
    if (doc.exists) {
      passedLevels = new Set(doc.data().passed);
    }
  } catch (e) {
    console.error(e);
  }
}