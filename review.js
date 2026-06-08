// review.js
let topicChart = null;
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
    if (topicChart) { topicChart.destroy(); topicChart = null; }
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
  // pie chart
  const ctx = document.getElementById('topic-chart').getContext('2d');
  if (topicChart) topicChart.destroy();
  topicChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: sorted.map(([topic]) => topic),
      datasets: [{
        data: sorted.map(([, count]) => count),
        backgroundColor: sorted.map((_, i) => 
          `hsl(${Math.round(i * 360 / sorted.length)}, 60%, 55%)`
        ),
        borderColor: '#000',
        borderWidth: 0,
        borderColor: '#000',
        borderWidth: 1,
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'WEAKPOINTS ANALYSIS',
          color: '#fff',
          font: { family: 'monospace', size: 15 },
          padding: { bottom: 10 }
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#fff',
            font: { family: 'monospace', size: 11 },
            boxWidth: 12,
            padding: 8,
          }
        },
        tooltip: {
          callbacks: {
            label: (item) => {
              const total = item.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((item.parsed / total) * 100).toFixed(1);
              return `${item.label}: ${pct}%`;
            }
          }
        }
      }
    }
  });
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
    <div class="mistake-card" style="position:relative">
        <button onclick="removeMistake('${mistakes[i].questionId}', this)" style="position:absolute;top:8px;right:8px;background:none;border:none;color:#888;font-size:1.2rem;cursor:pointer">✕</button>
        <p class="mistake-meta">#${i + 1}  ${m.topic}</p>
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

async function removeMistake(questionId, btn) {
  const card = document.getElementById('confirm-card');
  document.getElementById('confirm-message').textContent = 'Do you want to remove this mistake?';
  card.classList.add('open');

  document.getElementById('confirm-yes').onclick = async () => {
    
    card.classList.remove('open');
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snapshot = await db.collection('mistakes')
        .where('userId', '==', user.uid)
        .where('questionId', '==', Number(questionId))
        .get();
        snapshot.docs.forEach(doc => doc.ref.delete());
        btn.closest('.mistake-card').remove();

        const remaining = Array.from(document.querySelectorAll('.mistake-card')).map(card => {
          const meta = card.querySelector('.mistake-meta').textContent.trim();
          const topic = meta.split('  ')[1];
          return { topic };
        });
        renderSummary(remaining);
    } catch (e) {
      console.error('Failed to remove mistake:', e);
    }
  };

  document.getElementById('confirm-no').onclick = () => {
    card.classList.remove('open');
  };
}