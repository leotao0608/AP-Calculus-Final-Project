function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function register() {
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const username = document.getElementById('reg-username').value.trim();
  const errEl    = document.getElementById('auth-error');

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(cred.user.uid).set({
      username,
      email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    errEl.textContent = '';
    onLoginSuccess(cred.user);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function login() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('auth-error');

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    errEl.textContent = '';
    onLoginSuccess(cred.user);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function logout() {
  await auth.signOut();
  showScreen('screen-auth');
}

async function onLoginSuccess(user) {
  const doc = await db.collection('users').doc(user.uid).get();
  const username = doc.exists ? doc.data().username : user.email;
  document.getElementById('menu-welcome').textContent = `Welcome, ${username}`;
  await loadPassedLevels();
  const hasSave = await checkSaveExists();
  const menuNav = document.getElementById('menu-nav');
    menuNav.innerHTML = hasSave
    ? `
        <button class="btn-primary" onclick="showLevelSelect()">NEW GAME</button>
        <button class="btn-primary" onclick="continueGame()">CONTINUE</button>
        <button class="btn-primary" onclick="loadLeaderboard()">LEADERBOARD</button>
        <button class="btn-primary" onclick="loadReview()">REVIEW</button>
        <button class="btn-primary" onclick="logout()">SIGN OUT</button>
    `
    : `
        <button class="btn-primary" onclick="showLevelSelect()">NEW GAME</button>
        <button class="btn-primary" onclick="loadLeaderboard()">LEADERBOARD</button>
        <button class="btn-primary" onclick="loadReview()">REVIEW</button>
        <button class="btn-primary" onclick="logout()">SIGN OUT</button>
    `;

  showScreen('screen-menu');
}

auth.onAuthStateChanged(user => {
  if (user) {
    onLoginSuccess(user);
  } else {
    showScreen('screen-auth');
  }
});