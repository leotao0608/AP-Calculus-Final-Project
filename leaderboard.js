// leaderboard.js

async function loadLeaderboard() {
  showScreen('screen-leaderboard');
  const listEl = document.getElementById('leaderboard-list');
  listEl.innerHTML = '<p style="color:#888">Loading...</p>';

  try {
    const snapshot = await db.collection('passed').get();
    
    // collect highest levels
    const entries = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const uid = doc.id;
      const passed = data.passed || [];
      if (passed.length === 0) continue;
      const maxLevel = Math.max(...passed);

      // get username
      const userDoc = await db.collection('users').doc(uid).get();
      const username = userDoc.exists ? userDoc.data().username : 'Unknown';

      entries.push({ username, maxLevel, uid });
    }

    // rank according to highest levels
    entries.sort((a, b) => b.maxLevel - a.maxLevel);

    if (entries.length === 0) {
      listEl.innerHTML = '<p style="color:#888">No records yet.</p>';
      return;
    }

    const currentUid = auth.currentUser?.uid;
    listEl.innerHTML = entries.map((e, i) => `
      <div class="leaderboard-row ${e.uid === currentUid ? 'highlight' : ''}">
        <span class="lb-rank">#${i + 1}</span>
        <span class="lb-name">${e.username}</span>
        <span class="lb-level">Level ${e.maxLevel}</span>
      </div>
    `).join('');

  } catch (err) {
    listEl.innerHTML = '<p style="color:#888">Failed to load.</p>';
    console.error(err);
  }
}