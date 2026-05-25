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
    savedAt:       firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('progress').doc(user.uid).set(data);
    showSaveStatus('Saved!');
  } catch (e) {
    showSaveStatus('Save failed.');
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

    await loadMap(currentLevel);
    //restote player position
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
  setTimeout(() => el.textContent = '', 2000);
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


