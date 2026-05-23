// review.js

// ── save to Firestore ──────────────────────────
async function saveMistake(question, wrongIndex) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const existing = await db.collection('mistakes')
      .where('userId', '==', user.uid)
      .where('questionId', '==', question.id)
      .get();

    if (!existing.empty) {
      const docId = existing.docs[0].id;
      await db.collection('mistakes').doc(docId).update({
        wrongIndex: wrongIndex,
        timestamp:  firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('mistakes').add({
        userId:      user.uid,
        questionId:  question.id,
        topic:       question.topic,
        latex:       question.latex,
        options:     question.options,
        answerIndex: question.answerIndex,
        wrongIndex:  wrongIndex,
        timestamp:   firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (e) {
    console.error('Failed to save mistake:', e);
  }
}

// ── load review page ────────────────────────────
async function loadReview() {
  const user = auth.currentUser;
  if (!user) return;

  showScreen('screen-review');

  const snapshot = await db.collection('mistakes')
    .where('userId', '==', user.uid)
    .orderBy('timestamp', 'desc')
    .get();

  const mistakes = snapshot.docs.map(doc => doc.data());

  renderSummary(mistakes);
  renderMistakeList(mistakes);
}

// ── render mistakes summery ──────────────────────────────────
function renderSummary(mistakes) {
  const summaryEl = document.getElementById('review-summary');

  if (mistakes.length === 0) {
    summaryEl.innerHTML = '<p style="color:#888">No mistakes yet. Keep playing!</p>';
    return;
  }

  // topic statistics
  const counts = {};
  mistakes.forEach(m => {
    counts[m.topic] = (counts[m.topic] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  summaryEl.innerHTML = sorted.map(([topic, count]) => `
    <div class="summary-row">
      <span class="summary-topic">${topic}</span>
      <span class="summary-count">${count} mistake${count > 1 ? 's' : ''}</span>
    </div>
  `).join('');
}

// ── render wrong question list ──────────────────────────────────
function renderMistakeList(mistakes) {
    const listEl = document.getElementById('review-list');
    const labels = ['A', 'B', 'C', 'D'];
    if (mistakes.length === 0) {
        listEl.innerHTML = '';
        return;
    }

    listEl.innerHTML = mistakes.map((m, i) => `
        <div class="mistake-card">
            <p class="mistake-meta">${m.topic} · #${i + 1}</p>
            <div class="mistake-question">\\(${m.latex}\\)</div>
            <div class="mistake-options">
            
            ${m.options.map((opt, idx) => {
                let cls = 'review-option';
                if (idx === m.answerIndex) cls += ' correct';
                else if (idx === m.wrongIndex) cls += ' wrong';
                return `<div class="${cls}">${labels[idx]}. \\(${opt}\\)</div>`;
            }).join('')}
            </div>
        </div>
    `).join('');

    MathJax.typesetPromise([listEl]);
}