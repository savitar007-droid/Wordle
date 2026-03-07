console.count("SCRIPT LOADED");

/* ---------- CONSTANTS ---------- */
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const WIN_MESSAGES = [
  "Genius", "Magnificent", "Impressive",
  "Splendid", "Great", "Phew"
];

/* ---------- GAME STATE ---------- */
let board = [];
let row = 0;
let col = 0;
let gameMode = null;
let gameOver = true;
let currentUser = localStorage.getItem('user');
let isSubmitting = false;

/* ---------- KEYBOARD COLOR TRACKING ---------- */
let keyColors = {};

/* ---------- TIMER ---------- */
let timeLeft = 60;
let timerInterval = null;

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  checkGameAccess();
  createBoard();
  createKeyboard();

  const gameInProgress = localStorage.getItem('gameInProgress');
  const savedMode      = localStorage.getItem('currentGameMode');

  if (gameInProgress === 'true' && savedMode) {
    startGame(savedMode);
  } else {
    disableGameInput();
    updateModeButtons();
    showDefaultBoardState();
    setTimeout(() => openModeModal(), 400);
  }

  document.addEventListener("keydown", onKey);
  checkLoginStatus();
});

/* ---------- DATE HELPERS ---------- */
function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/* ---------- SHOW DEFAULT BOARD (no active game) ---------- */
function showDefaultBoardState() {
  const today = getTodayString();
  const priority = ['normal', 'time', 'sudden'];

  for (const mode of priority) {
    const saved = localStorage.getItem(`completedBoard_${currentUser}_${mode}_${today}`);
    if (!saved) continue;
    try {
      const gs = JSON.parse(saved);
      if (!gs.boardState) continue;

      for (let r = 0; r < MAX_ATTEMPTS; r++)
        for (let c = 0; c < WORD_LENGTH; c++)
          if (gs.boardState[r] && gs.boardState[r][c]) {
            board[r][c].innerText = gs.boardState[r][c].text    || "";
            board[r][c].className = gs.boardState[r][c].classes || "tile";
          }

      if (gs.keyColors)
        Object.entries(gs.keyColors).forEach(([letter, color]) => {
          const el = document.getElementById("key-" + letter);
          if (el) { el.classList.remove("green","yellow","gray"); el.classList.add(color); }
        });

      return;
    } catch(e) { }
  }
}

/* ---------- ONE-PLAY-PER-MODE-PER-DAY ---------- */
function hasModeBeenPlayedToday(mode) {
  const today = getTodayString();
  return localStorage.getItem(`modePlayed_${currentUser}_${mode}_${today}`) === 'true';
}

function markModePlayedToday(mode) {
  const today = getTodayString();
  localStorage.setItem(`modePlayed_${currentUser}_${mode}_${today}`, 'true');
  localStorage.setItem('lastPlayedMode', mode);
}

/* ---------- CHECK GAME ACCESS ---------- */
function checkGameAccess() {
  const user = localStorage.getItem('user');
  if (!user) { alert('Please login to play!'); window.location.replace('/'); return; }

  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    if (!localStorage.getItem('user')) window.location.replace('/');
    else history.pushState(null, null, location.href);
  };

  window.addEventListener('pageshow', function (e) {
    if (e.persisted || (window.performance && window.performance.navigation.type === 2)) {
      if (!localStorage.getItem('user')) { alert('Session expired.'); window.location.replace('/'); }
    }
  });
}

function checkLoginStatus() {
  if (currentUser) console.log('User logged in:', currentUser);
}

/* ---------- LOAD HINT FOR MODE ---------- */
async function loadHintForMode(mode) {
  try {
    console.log('Fetching hint for mode:', mode);
    const response = await fetch(`/api/hint?mode=${mode}`);
    const data = await response.json();
    console.log('Hint received:', data);

    const banner = document.getElementById('hintBanner');
    if (banner) {
      banner.textContent = data.hint;
      banner.classList.add('visible');
      console.log('✓ Hint banner updated:', data.hint);
    } else {
      console.error('✗ Hint banner element not found!');
    }
  } catch (error) {
    console.error('Error loading hint:', error);
    const banner = document.getElementById('hintBanner');
    if (banner) {
      banner.textContent = '💡 Guess the 5-letter word!';
      banner.classList.add('visible');
    }
  }
}

/* ---------- MODE CONTROL ---------- */
function startGame(mode) {
  const isResuming = localStorage.getItem('gameInProgress') === 'true'
                  && localStorage.getItem('currentGameMode') === mode;

  if (!isResuming && hasModeBeenPlayedToday(mode)) {
    document.getElementById("mode-modal").style.display = "none";
    showAlreadyPlayedMessage(mode);
    return;
  }

  gameMode = mode;
  localStorage.setItem('lastPlayedMode', mode);
  gameOver = false;
  isSubmitting = false;

  if (isResuming) restoreGameState();
  else { clearGameState(); resetGame(); }

  document.getElementById("mode-modal").style.display = "none";
  enableGameInput();

  // LOAD THE HINT FOR THIS MODE
  loadHintForMode(mode);

  if (mode === "time") startTimer();
  else clearTimer();
}

/* ---------- ALREADY PLAYED POPUP ---------- */
function showAlreadyPlayedMessage(mode) {
  const modeNames = { normal: 'Normal', time: '60s Time', sudden: 'Sudden Death' };
  const modeName  = modeNames[mode] || mode;

  const now = new Date(); const midnight = new Date(); midnight.setHours(24,0,0,0);
  const msLeft = midnight - now;
  const h = Math.floor(msLeft / (1000*60*60));
  const m = Math.floor((msLeft % (1000*60*60)) / (1000*60));

  const existing = document.getElementById('already-played-msg');
  if (existing) existing.remove();

  const savedState = localStorage.getItem(`completedBoard_${currentUser}_${mode}_${getTodayString()}`);
  let boardHTML = '';
  if (savedState) {
    try {
      const gs = JSON.parse(savedState);
      const colorMap = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e' };
      boardHTML = '<div style="margin:10px auto 0;display:inline-block;">';
      gs.boardState.forEach(rowData => {
        const hasLetters = rowData.some(t => t.text && t.text.trim());
        if (!hasLetters) return;
        boardHTML += '<div style="display:flex;gap:3px;margin-bottom:3px;justify-content:center;">';
        rowData.forEach(tile => {
          let bg = '#e0e0e0';
          if (tile.classes.includes('green'))       bg = colorMap.green;
          else if (tile.classes.includes('yellow'))  bg = colorMap.yellow;
          else if (tile.classes.includes('gray'))    bg = colorMap.gray;
          boardHTML += `<div style="width:28px;height:28px;background:${bg};color:white;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:bold;border-radius:2px;">${tile.text}</div>`;
        });
        boardHTML += '</div>';
      });
      boardHTML += '</div>';
    } catch(e) { boardHTML = ''; }
  }

  const popup = document.createElement('div');
  popup.id = 'already-played-msg';
  popup.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:white;border:2px solid #6aaa64;border-radius:12px;
    padding:24px 28px;text-align:center;z-index:9999;
    box-shadow:0 10px 30px rgba(0,0,0,0.25);
    max-width:340px;width:90%;max-height:90vh;overflow-y:auto;
  `;
  popup.innerHTML = `
    <div style="font-size:36px;margin-bottom:8px;">✅</div>
    <h2 style="margin-bottom:6px;color:#121212;font-size:18px;">Already Played!</h2>
    <p style="color:#555;font-size:13px;margin-bottom:4px;">
      You already completed <strong>${modeName}</strong> today.
    </p>
    <p style="color:#888;font-size:12px;margin-bottom:8px;">
      Next reset in <strong>${h}h ${m}m</strong>
    </p>
    ${boardHTML}
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
      <button onclick="document.getElementById('already-played-msg').remove();openModeModal();"
        style="padding:9px 16px;background:#6aaa64;color:white;border:none;
               border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">
        Try Another Mode
      </button>
      <button onclick="document.getElementById('already-played-msg').remove();"
        style="padding:9px 16px;background:#eee;color:#333;border:none;
               border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">
        Close
      </button>
    </div>
  `;
  document.body.appendChild(popup);
}

function openModeModal() {
  if (!gameOver) { showToast("Can't change mode during an active game"); return; }
  updateModeButtons();
  document.getElementById("mode-modal").style.display = "flex";
}

function updateModeButtons() {
  const modes  = ['normal', 'time', 'sudden'];
  const labels = { normal: 'Normal', time: '60s Time Mode', sudden: 'Sudden Death' };
  const modeBox = document.getElementById('mode-box');
  if (!modeBox) return;
  const buttons = modeBox.querySelectorAll('button');
  modes.forEach((mode, idx) => {
    if (!buttons[idx]) return;
    const played = hasModeBeenPlayedToday(mode);
    buttons[idx].style.background = played ? '#787c7e' : '#6aaa64';
    buttons[idx].style.opacity    = played ? '0.75' : '1';
    buttons[idx].style.cursor     = played ? 'not-allowed' : 'pointer';
    buttons[idx].textContent      = played ? `${labels[mode]} ✓ Done` : labels[mode];
  });
}

/* ---------- INPUT ENABLE / DISABLE ---------- */
function disableGameInput() {
  board.forEach(r => r.forEach(t => (t.style.pointerEvents = "none")));
  document.getElementById("keyboard").style.pointerEvents = "none";
}
function enableGameInput() {
  board.forEach(r => r.forEach(t => (t.style.pointerEvents = "auto")));
  document.getElementById("keyboard").style.pointerEvents = "auto";
}

/* ---------- RESET ---------- */
function resetGame() {
  row = 0; col = 0; gameOver = false; isSubmitting = false; keyColors = {};
  for (let r = 0; r < MAX_ATTEMPTS; r++)
    for (let c = 0; c < WORD_LENGTH; c++) {
      board[r][c].innerText = "";
      board[r][c].className = "tile";
    }
  document.querySelectorAll(".key").forEach(k => k.classList.remove("green","yellow","gray"));
}

/* ---------- TIMER ---------- */
function startTimer() {
  if (hasModeBeenPlayedToday('time')) {
    gameOver = true;
    disableGameInput();
    clearGameState();
    showAlreadyPlayedMessage('time');
    return;
  }

  const savedStart = localStorage.getItem('timerStartTime');
  const now = Date.now();

  if (savedStart) {
    const elapsed = Math.floor((now - parseInt(savedStart)) / 1000);
    timeLeft = Math.max(0, 60 - elapsed);
    if (timeLeft <= 0) {
      markModePlayedToday('time');
      saveCompletedBoard('time');
      clearGameState();
      gameOver = true;
      disableGameInput();
      showAlreadyPlayedMessage('time');
      return;
    }
  } else {
    timeLeft = 60;
    localStorage.setItem('timerStartTime', now.toString());
  }

  updateTimer();
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    localStorage.setItem('timeLeft', timeLeft.toString());
    if (timeLeft <= 0) {
      markModePlayedToday('time');
      saveCompletedBoard('time');
      endGame("⏰ Time's up!");
    }
  }, 1000);
}

function clearTimer() {
  clearInterval(timerInterval); timerInterval = null;
  document.getElementById("timer").innerText = "";
  localStorage.removeItem('timerStartTime');
  localStorage.removeItem('timeLeft');
}

function updateTimer() {
  document.getElementById("timer").innerText = `⏱ ${timeLeft}s`;
}

/* ---------- BOARD ---------- */
function createBoard() {
  const boardDiv = document.getElementById("board");
  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    board[r] = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      rowDiv.appendChild(tile);
      board[r][c] = tile;
    }
    boardDiv.appendChild(rowDiv);
  }
}

/* ---------- KEYBOARD ---------- */
function createKeyboard() {
  const layout = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["ENTER","Z","X","C","V","B","N","M","⌫"]
  ];
  const kb = document.getElementById("keyboard");
  layout.forEach((r, i) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "keyboard-row";
    if (i === 1) rowDiv.style.marginLeft = "18px";
    r.forEach(k => {
      const key = document.createElement("div");
      key.className = "key";
      if (k === "ENTER" || k === "⌫") key.classList.add("wide");
      key.innerText = k;
      key.id = "key-" + k;
      key.onclick = () => handle(k);
      rowDiv.appendChild(key);
    });
    kb.appendChild(rowDiv);
  });
}

/* ---------- KEY COLOR ---------- */
function updateKeyColor(letter, color) {
  const priority = { green: 3, yellow: 2, gray: 1 };
  const current  = keyColors[letter];
  if (!current || priority[color] > priority[current]) {
    keyColors[letter] = color;
    const el = document.getElementById("key-" + letter);
    if (el) { el.classList.remove("green","yellow","gray"); el.classList.add(color); }
  }
}

/* ---------- INPUT ---------- */
function onKey(e) {
  if (gameOver || !gameMode || isSubmitting) return;
  if (e.key === "Enter")              handle("ENTER");
  else if (e.key === "Backspace")     handle("⌫");
  else if (/^[A-Za-z]$/.test(e.key)) handle(e.key.toUpperCase());
}

function handle(k) {
  if (gameOver || isSubmitting) return;
  if (k === "ENTER")  submit();
  else if (k === "⌫") back();
  else                add(k);
}

function add(ch) {
  if (col < WORD_LENGTH) { board[row][col].innerText = ch; col++; }
}

function back() {
  if (col > 0) { col--; board[row][col].innerText = ""; }
}

/* ---------- WORD VALIDATION - NOW ASYNC WITH BACKEND ---------- */
async function isValidWord(word) {
  if (!word || word.length !== 5) return false;

  try {
    const response = await fetch(`/api/validate-word?word=${encodeURIComponent(word.toUpperCase())}`);
    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Word validation error:', error);
    // Fallback to basic check if API fails
    return /^[A-Z]{5}$/i.test(word);
  }
}

/* ---------- SUBMIT ---------- */
async function submit() {
  if (col !== WORD_LENGTH || isSubmitting) return;
  isSubmitting = true;

  const guess = board[row].map(t => t.innerText).join("");

  // AWAIT the async validation
  const valid = await isValidWord(guess);
  if (!valid) {
    showInvalidWord();
    isSubmitting = false;
    return;
  }

  const res = await fetch("/api/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guess, mode: gameMode })
  });

  if (!res.ok) { showInvalidWord(); isSubmitting = false; return; }

  const result = (await res.json()).split("");
  let allGreen = true;

  const animPromises = result.map((r, i) => new Promise(resolve => {
    const tile   = board[row][i];
    const letter = tile.innerText;
    const status = r === "G" ? "green" : r === "Y" ? "yellow" : "gray";
    if (r !== "G") allGreen = false;

    setTimeout(() => {
      tile.style.transition = 'transform 0.22s ease-in';
      tile.style.transform  = 'rotateX(90deg)';

      setTimeout(() => {
        tile.classList.add(status);
        updateKeyColor(letter, status);

        tile.style.transition = 'transform 0.22s ease-out';
        tile.style.transform  = 'rotateX(0deg)';

        setTimeout(() => {
          tile.style.transition = '';
          tile.style.transform  = '';
          resolve();
        }, 230);
      }, 230);
    }, i * 110);
  }));

  await Promise.all(animPromises);
  await new Promise(r => setTimeout(r, 120));

  const completedRow = row;
  row++;
  col = 0;
  saveGameState();

  if (allGreen) {
    markModePlayedToday(gameMode);
    saveCompletedBoard(gameMode);
    handleWin(completedRow + 1);
    endGame("");
    clearGameState();
    isSubmitting = false;
    return;
  }

  if (gameMode === "sudden") {
    markModePlayedToday(gameMode);
    saveCompletedBoard(gameMode);
    endGame("💀 Sudden Death! One wrong guess.");
    clearGameState();
    isSubmitting = false;
    return;
  }

  if (row === MAX_ATTEMPTS) {
    markModePlayedToday(gameMode);
    saveCompletedBoard(gameMode);
    endGame("Game Over");
    clearGameState();
    isSubmitting = false;
    return;
  }

  isSubmitting = false;
}

/* ---------- SAVE COMPLETED BOARD ---------- */
function saveCompletedBoard(mode) {
  const today    = getTodayString();
  const snapshot = { boardState: [], keyColors };
  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    snapshot.boardState[r] = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      snapshot.boardState[r][c] = {
        text:    board[r][c].innerText,
        classes: board[r][c].className
      };
    }
  }
  localStorage.setItem(`completedBoard_${currentUser}_${mode}_${today}`, JSON.stringify(snapshot));
  localStorage.setItem('lossGameState', JSON.stringify(snapshot));
}

/* ---------- SHOW INVALID WORD ---------- */
function showInvalidWord() {
  const rowElement = board[row][0].parentElement;
  rowElement.classList.add('shake');
  showToast("Word not in list");
  setTimeout(() => rowElement.classList.remove('shake'), 500);
}

/* ---------- HANDLE WIN ---------- */
function handleWin(attempts) {
  const winMessage = WIN_MESSAGES[attempts - 1];
  currentUser = localStorage.getItem('user');

  const winRow = attempts - 1;
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = board[winRow][c];
    setTimeout(() => {
      tile.style.transition = 'transform 0.12s ease-out';
      tile.style.transform  = 'translateY(-28px) scale(1.15)';
      setTimeout(() => {
        tile.style.transition = 'transform 0.1s ease-in';
        tile.style.transform  = 'translateY(0) scale(1)';
        setTimeout(() => {
          tile.style.transition = '';
          tile.style.transform  = '';
        }, 100);
      }, 150);
    }, c * 80);
  }

  const totalBounceMs = WORD_LENGTH * 80 + 300;
  setTimeout(() => showToast("🎉 " + winMessage + " 🎉"), totalBounceMs);

  if (currentUser) {
    updateUserStats(attempts);
    setTimeout(() => { window.location.href = '/statistics'; }, totalBounceMs + 1800);
  } else {
    setTimeout(() => { showWinModal(winMessage); }, totalBounceMs + 1000);
  }
}

/* ---------- UPDATE USER STATS (WIN) ---------- */
async function updateUserStats(attempts) {
  const statsKey = 'wordleStats_' + currentUser;
  let stats = JSON.parse(
    localStorage.getItem(statsKey) ||
    '{"played":0,"won":0,"currentStreak":0,"maxStreak":0,"distribution":[0,0,0,0,0,0],"lastWin":null}'
  );
  stats.played++;
  stats.won++;
  stats.currentStreak++;
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  stats.distribution[attempts - 1]++;
  stats.lastWin = attempts;
  localStorage.setItem(statsKey, JSON.stringify(stats));
  try {
    await fetch('/api/stats/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser, guesses: attempts, won: true })
    });
  } catch (err) { console.error('Error saving win stats:', err); }
}

/* ---------- SAVE GAME STATE ---------- */
function saveGameState() {
  if (!gameMode) return;
  const gameState = {
    mode: gameMode, row, col, boardState: [], keyColors,
    timeLeft, timerStartTime: localStorage.getItem('timerStartTime')
  };
  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    gameState.boardState[r] = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      gameState.boardState[r][c] = {
        text: board[r][c].innerText, classes: board[r][c].className
      };
    }
  }
  localStorage.setItem('currentGameMode', gameMode);
  localStorage.setItem('gameInProgress',  'true');
  localStorage.setItem('gameState',       JSON.stringify(gameState));
  localStorage.setItem('timeLeft',        timeLeft.toString());
}

/* ---------- RESTORE GAME STATE ---------- */
function restoreGameState() {
  const savedState = localStorage.getItem('gameState');
  if (!savedState) { resetGame(); return; }
  try {
    const gs = JSON.parse(savedState);
    row = typeof gs.row === 'number' ? gs.row : 0;
    col = typeof gs.col === 'number' ? gs.col : 0;
    timeLeft = gs.timeLeft || 60;
    isSubmitting = false;
    if (gs.boardState) {
      for (let r = 0; r < MAX_ATTEMPTS; r++)
        for (let c = 0; c < WORD_LENGTH; c++)
          if (gs.boardState[r] && gs.boardState[r][c]) {
            board[r][c].innerText = gs.boardState[r][c].text    || "";
            board[r][c].className = gs.boardState[r][c].classes || "tile";
          }
    }
    keyColors = gs.keyColors || {};
    Object.entries(keyColors).forEach(([letter, color]) => {
      const el = document.getElementById("key-" + letter);
      if (el) { el.classList.remove("green","yellow","gray"); el.classList.add(color); }
    });
    console.log('Restored. Row:', row, 'Col:', col);
  } catch (err) { console.error('Restore failed:', err); resetGame(); }
}

/* ---------- CLEAR GAME STATE ---------- */
function clearGameState() {
  localStorage.removeItem('gameInProgress');
  localStorage.removeItem('gameState');
  localStorage.removeItem('currentGameMode');
  localStorage.removeItem('timeLeft');
  localStorage.removeItem('timerStartTime');
}

/* ---------- END GAME ---------- */
async function endGame(msg) {
  gameOver = true;
  isSubmitting = false;
  clearTimer();
  disableGameInput();

  if (msg && msg.length > 0) {
    showToast(msg);
    const user = localStorage.getItem('user');
    if (user) {
      const statsKey = 'wordleStats_' + user;
      let stats = JSON.parse(
        localStorage.getItem(statsKey) ||
        '{"played":0,"won":0,"currentStreak":0,"maxStreak":0,"distribution":[0,0,0,0,0,0]}'
      );
      stats.played++;
      stats.currentStreak = 0;
      localStorage.setItem(statsKey, JSON.stringify(stats));

      try {
        await fetch('/api/stats/update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, guesses: 0, won: false })
        });
      } catch (err) { console.error('Error saving loss stats:', err); }

      setTimeout(() => { window.location.href = '/loss'; }, 2000);
    }
  }
}

/* ---------- TOAST ---------- */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  toast.classList.add("show");
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.classList.remove("show");
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 2000);
}

/* ---------- WIN MODAL ---------- */
function showWinModal(text) {
  document.getElementById("win-text").innerText = text;
  document.getElementById("win-modal").style.display = "flex";
}
function closeWinModal() { document.getElementById("win-modal").style.display = "none"; }
function redirectToAuth() { window.location.href = "/login"; }