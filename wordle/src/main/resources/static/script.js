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
let isSubmitting = false; // prevent double-submit during animation

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
  const savedMode = localStorage.getItem('currentGameMode');

  if (gameInProgress === 'true' && savedMode) {
    startGame(savedMode);
  } else {
    disableGameInput();
    updateModeButtons();
  }

  document.addEventListener("keydown", onKey);
  checkLoginStatus();
});

/* ---------- DATE HELPERS ---------- */
function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/* ---------- ONE-PLAY-PER-MODE-PER-DAY ---------- */
function hasModeBeenPlayedToday(mode) {
  const today = getTodayString();
  const key = `modePlayed_${currentUser}_${mode}_${today}`;
  return localStorage.getItem(key) === 'true';
}

function markModePlayedToday(mode) {
  const today = getTodayString();
  const key = `modePlayed_${currentUser}_${mode}_${today}`;
  localStorage.setItem(key, 'true');
  localStorage.setItem('lastPlayedMode', mode);
}

/* ---------- CHECK GAME ACCESS ---------- */
function checkGameAccess() {
  const user = localStorage.getItem('user');
  if (!user) {
    alert('Please login to play!');
    window.location.replace('/');
    return;
  }

  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    const u = localStorage.getItem('user');
    if (!u) {
      window.location.replace('/');
    } else {
      history.pushState(null, null, location.href);
    }
  };

  window.addEventListener('pageshow', function (event) {
    if (event.persisted ||
        (window.performance && window.performance.navigation.type === 2)) {
      const u = localStorage.getItem('user');
      if (!u) {
        alert('Session expired. Please login again.');
        window.location.replace('/');
      }
    }
  });
}

/* ---------- CHECK LOGIN STATUS ---------- */
function checkLoginStatus() {
  if (currentUser) {
    console.log('User logged in:', currentUser);
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
  localStorage.setItem('lastPlayedMode', mode); // ← ADD THIS LINE
  gameOver = false;
  isSubmitting = false;

  if (isResuming) {
    restoreGameState();
  } else {
    clearGameState();
    resetGame();
  }

  document.getElementById("mode-modal").style.display = "none";
  enableGameInput();

  if (mode === "time") {
    startTimer();
  } else {
    clearTimer();
  }
}

/* ---------- ALREADY PLAYED POPUP ---------- */
function showAlreadyPlayedMessage(mode) {
  const modeNames = { normal: 'Normal', time: '60s Time', sudden: 'Sudden Death' };
  const modeName = modeNames[mode] || mode;

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msLeft = midnight - now;
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

  const existing = document.getElementById('already-played-msg');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'already-played-msg';
  popup.style.cssText = `
    position:fixed;top:50%;left:50%;
    transform:translate(-50%,-50%);
    background:white;border:2px solid #6aaa64;
    border-radius:12px;padding:28px 32px;
    text-align:center;z-index:9999;
    box-shadow:0 10px 30px rgba(0,0,0,0.25);
    max-width:360px;width:90%;
  `;
  popup.innerHTML = `
    <div style="font-size:38px;margin-bottom:10px;">✅</div>
    <h2 style="margin-bottom:8px;color:#121212;font-size:20px;">Already Played!</h2>
    <p style="color:#555;margin-bottom:6px;font-size:14px;">
      You have already completed <strong>${modeName}</strong> mode today.
    </p>
    <p style="color:#888;font-size:13px;margin-bottom:20px;">
      Next words reset in <strong>${hoursLeft}h ${minsLeft}m</strong>
    </p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <button onclick="document.getElementById('already-played-msg').remove();openModeModal();"
        style="padding:10px 18px;background:#6aaa64;color:white;border:none;
               border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">
        Try Another Mode
      </button>
      <button onclick="document.getElementById('already-played-msg').remove();"
        style="padding:10px 18px;background:#eee;color:#333;border:none;
               border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">
        Close
      </button>
    </div>
  `;
  document.body.appendChild(popup);
}

function openModeModal() {
  if (!gameOver) {
    showToast("Can't change mode during an active game");
    return;
  }
  updateModeButtons();
  document.getElementById("mode-modal").style.display = "flex";
}

/* ---------- UPDATE MODE MODAL BUTTONS ---------- */
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
    buttons[idx].style.opacity    = played ? '0.75'    : '1';
    buttons[idx].style.cursor     = played ? 'not-allowed' : 'pointer';
    buttons[idx].textContent      = played
      ? `${labels[mode]} ✓ Done`
      : labels[mode];
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
  row = 0;
  col = 0;
  gameOver = false;
  isSubmitting = false;
  keyColors = {};

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      board[r][c].innerText = "";
      board[r][c].className = "tile";
    }
  }

  document.querySelectorAll(".key")
    .forEach(k => k.classList.remove("green", "yellow", "gray"));
}

/* ---------- TIMER ---------- */
function startTimer() {
  const savedStart = localStorage.getItem('timerStartTime');
  const now = Date.now();

  if (savedStart) {
    const elapsed = Math.floor((now - parseInt(savedStart)) / 1000);
    timeLeft = Math.max(0, 60 - elapsed);
    if (timeLeft <= 0) { endGame("⏰ Time's up!"); return; }
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
    if (timeLeft <= 0) endGame("⏰ Time's up!");
  }, 1000);
}

function clearTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
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

/* ---------- KEY COLOR (priority: green > yellow > gray) ---------- */
function updateKeyColor(letter, color) {
  const priority = { green: 3, yellow: 2, gray: 1 };
  const current  = keyColors[letter];
  if (!current || priority[color] > priority[current]) {
    keyColors[letter] = color;
    const el = document.getElementById("key-" + letter);
    if (el) {
      el.classList.remove("green", "yellow", "gray");
      el.classList.add(color);
    }
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
  if (col < WORD_LENGTH) {
    board[row][col].innerText = ch;
    col++;
  }
}

function back() {
  if (col > 0) {
    col--;
    board[row][col].innerText = "";
  }
}

/* ---------- SUBMIT ---------- */
async function submit() {
  if (col !== WORD_LENGTH) return;
  if (isSubmitting) return;
  isSubmitting = true;

  const guess = board[row].map(t => t.innerText).join("");

  if (!isValidWord(guess)) {
    showInvalidWord();
    isSubmitting = false;
    return;
  }

  const res = await fetch("/api/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guess, mode: gameMode })
  });

  if (!res.ok) {
    showInvalidWord();
    isSubmitting = false;
    return;
  }

  const result = (await res.json()).split("");
  let allGreen = true;

  // Flip animation — each tile flips one by one, color applied mid-flip
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile   = board[row][i];
    const letter = tile.innerText;
    const status = result[i] === "G" ? "green"
                 : result[i] === "Y" ? "yellow"
                 : "gray";

    if (result[i] !== "G") allGreen = false;

    await new Promise(resolve => {
      setTimeout(() => {
        tile.classList.add('flip');
        setTimeout(() => {
          tile.classList.remove('flip');
          tile.classList.add(status);
          updateKeyColor(letter, status);
          resolve();
        }, 250); // halfway through flip
      }, i * 150); // stagger each tile
    });
  }

  // Small pause after last tile
  await new Promise(resolve => setTimeout(resolve, 200));

  // Snapshot current row/col BEFORE saving (row hasn't incremented yet)
  const completedRow = row;

  // Save state with correct row/col
  row++;
  col = 0;
  saveGameState();

  // Determine game outcome
  if (allGreen) {
    markModePlayedToday(gameMode);
    handleWin(completedRow + 1);
    endGame("");
    clearGameState();
    isSubmitting = false;
    return;
  }

  if (gameMode === "sudden") {
    markModePlayedToday(gameMode);
    endGame("💀 Sudden Death! One wrong guess.");
    clearGameState();
    isSubmitting = false;
    return;
  }

  if (row === MAX_ATTEMPTS) {
    markModePlayedToday(gameMode);
    endGame("Game Over");
    clearGameState();
    isSubmitting = false;
    return;
  }

  // Still going — re-enable input
  isSubmitting = false;
}

/* ---------- WORD VALIDATION ---------- */
function isValidWord(word) {
  const validWords = [
    "HELLO","WORLD","CRANE","SLATE","ADIEU","STARE","TRAIN","BREAK","LIGHT","PRIZE",
    "ABOUT","ABOVE","ACTOR","ACUTE","ADMIT","ADOPT","ADULT","AFTER","AGAIN","AGENT",
    "AGREE","AHEAD","ALARM","ALBUM","ALERT","ALIGN","ALIKE","ALIVE","ALLOW","ALONE",
    "ALONG","ALTER","AMBER","AMEND","ANGEL","ANGER","ANGLE","ANGRY","APART","APPLE",
    "APPLY","ARENA","ARGUE","ARISE","ARRAY","ARROW","ASIDE","ASSET","AUDIO","AUDIT",
    "AVOID","AWARD","AWARE","BADLY","BAKER","BASES","BASIC","BASIN","BASIS","BEACH",
    "BEGAN","BEGIN","BEGUN","BEING","BELOW","BENCH","BILLY","BIRTH","BLACK","BLADE",
    "BLAME","BLANK","BLAST","BLEED","BLESS","BLIND","BLOCK","BLOOD","BLOOM","BLOWN",
    "BLUES","BOARD","BOOST","BOOTH","BOUND","BRAIN","BRAND","BRASS","BRAVE","BREAD",
    "BREED","BRIEF","BRING","BROAD","BROKE","BROWN","BUILD","BUILT","BUYER","CABLE",
    "CALIF","CARRY","CATCH","CAUSE","CHAIN","CHAIR","CHAOS","CHARM","CHART","CHASE",
    "CHEAP","CHECK","CHESS","CHEST","CHIEF","CHILD","CHINA","CHOSE","CIVIL","CLAIM",
    "CLASS","CLEAN","CLEAR","CLICK","CLIFF","CLIMB","CLOCK","CLOSE","CLOTH","CLOUD",
    "COACH","COAST","COULD","COUNT","COURT","COVER","CRACK","CRAFT","CRASH","CRAZY",
    "CREAM","CRIME","CROSS","CROWD","CROWN","CRUDE","CURVE","CYCLE","DAILY","DANCE",
    "DATED","DEALT","DEATH","DEBUT","DELAY","DELTA","DENSE","DEPOT","DEPTH","DOING",
    "DOUBT","DOZEN","DRAFT","DRAMA","DRANK","DRAWN","DREAM","DRESS","DRILL","DRINK",
    "DRIVE","DROVE","DYING","EAGER","EARLY","EARTH","EIGHT","ELITE","EMPTY","ENEMY",
    "ENJOY","ENTER","ENTRY","EQUAL","ERROR","EVENT","EVERY","EXACT","EXIST","EXTRA",
    "FAITH","FALSE","FAULT","FIBER","FIELD","FIFTH","FIFTY","FIGHT","FINAL","FIRST",
    "FIXED","FLASH","FLEET","FLOOR","FLUID","FOCUS","FORCE","FORTH","FORTY","FORUM",
    "FOUND","FRAME","FRANK","FRAUD","FRESH","FRONT","FRUIT","FULLY","FUNNY","GIANT",
    "GIVEN","GLASS","GLOBE","GOING","GRACE","GRADE","GRAND","GRANT","GRASS","GRAVE",
    "GREAT","GREEN","GROSS","GROUP","GROWN","GUARD","GUESS","GUEST","GUIDE","HAPPY",
    "HARRY","HEART","HEAVY","HENCE","HENRY","HORSE","HOTEL","HOUSE","HUMAN","IDEAL",
    "IMAGE","INDEX","INNER","INPUT","ISSUE","JIMMY","JOINT","JONES","JUDGE","KNOWN",
    "LABEL","LARGE","LASER","LATER","LAUGH","LAYER","LEARN","LEASE","LEAST","LEAVE",
    "LEGAL","LEMON","LEVEL","LEWIS","LIGHT","LIMIT","LINKS","LIVES","LOCAL","LOGIC",
    "LOOSE","LOWER","LUCKY","LUNCH","LYING","MAGIC","MAJOR","MAKER","MARCH","MARIA",
    "MATCH","MAYBE","MAYOR","MEANT","MEDIA","METAL","MIGHT","MINOR","MINUS","MIXED",
    "MODEL","MONEY","MONTH","MORAL","MOTOR","MOUNT","MOUSE","MOUTH","MOVIE","MUSIC",
    "NEEDS","NEVER","NEWLY","NIGHT","NOISE","NORTH","NOTED","NOVEL","NURSE","OCCUR",
    "OCEAN","OFFER","OFTEN","ORDER","OTHER","OUGHT","PAINT","PANEL","PAPER","PARTY",
    "PEACE","PETER","PHASE","PHONE","PHOTO","PIECE","PILOT","PITCH","PLACE","PLAIN",
    "PLANE","PLANT","PLATE","POINT","POUND","POWER","PRESS","PRICE","PRIDE","PRIME",
    "PRINT","PRIOR","PROOF","PROUD","PROVE","QUEEN","QUICK","QUIET","QUITE","RADIO",
    "RAISE","RANGE","RAPID","RATIO","REACH","READY","REFER","RIGHT","RIVAL","RIVER",
    "ROGER","ROMAN","ROUGH","ROUND","ROUTE","ROYAL","RURAL","SCALE","SCENE","SCOPE",
    "SCORE","SENSE","SERVE","SEVEN","SHALL","SHAPE","SHARE","SHARP","SHEET","SHELF",
    "SHELL","SHIFT","SHINE","SHIRT","SHOCK","SHOOT","SHORT","SHOWN","SIGHT","SINCE",
    "SIXTH","SIZED","SKILL","SLEEP","SLIDE","SMALL","SMART","SMILE","SMITH","SMOKE",
    "SOLID","SOLVE","SORRY","SOUND","SOUTH","SPACE","SPARE","SPEAK","SPEED","SPEND",
    "SPENT","SPLIT","SPOKE","SPORT","STAFF","STAGE","STAKE","STAND","START","STATE",
    "STEAM","STEEL","STICK","STILL","STOCK","STONE","STOOD","STORE","STORM","STORY",
    "STRIP","STUCK","STUDY","STUFF","STYLE","SUGAR","SUITE","SUPER","SWEET","TABLE",
    "TAKEN","TASTE","TAXES","TEACH","TERRY","TEXAS","THANK","THEFT","THEIR","THEME",
    "THERE","THESE","THICK","THING","THINK","THIRD","THOSE","THREE","THREW","THROW",
    "TIGHT","TIMES","TITLE","TODAY","TOPIC","TOTAL","TOUCH","TOUGH","TOWER","TRACK",
    "TRADE","TREND","TRIAL","TRIBE","TRICK","TRIED","TROOP","TRUCK","TRULY","TRUNK",
    "TRUST","TRUTH","TWICE","UNDER","UNDUE","UNION","UNITY","UNTIL","UPPER","UPSET",
    "URBAN","USAGE","USUAL","VALID","VALUE","VIDEO","VIRUS","VISIT","VITAL","VOCAL",
    "VOICE","WASTE","WATCH","WATER","WHEEL","WHERE","WHICH","WHILE","WHITE","WHOLE",
    "WHOSE","WOMAN","WOMEN","WORTH","WOULD","WOUND","WRITE","WRONG","WROTE","YIELD",
    "YOUNG","YOURS","YOUTH","PLUMB","GRIEF","STAMP","BLAZE","GLINT","HOVER","FLOAT",
    "GRAZE","HINGE","JOUST","KNEEL","LAPSE","MANOR","NERVE","ONSET","FROST","GLOOM",
    "HARSH","JOKER","KNACK","LIVER","MIXER","NOBLE","ORBIT","PATSY","QUIRK","CLOTH",
    "DRAFT","FRAME","REALM","SPARK","SALVO","TIMID","VENOM","WALTZ","REACH","WRATH"
  ];
  return validWords.includes(word.toUpperCase());
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
  showToast("🎉 " + winMessage + " 🎉");

  currentUser = localStorage.getItem('user');

  if (currentUser) {
    updateUserStats(attempts);
    setTimeout(() => { window.location.href = '/statistics'; }, 2500);
  } else {
    setTimeout(() => { showWinModal(winMessage); }, 2000);
  }
}

/* ---------- UPDATE USER STATS ---------- */
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser, guesses: attempts, won: true })
    });
  } catch (err) {
    console.error('Error saving win stats:', err);
  }
}

/* ---------- SAVE GAME STATE ---------- */
function saveGameState() {
  if (!gameMode) return;

  const gameState = {
    mode: gameMode,
    row,         // this is already incremented to next row
    col,         // this is reset to 0
    boardState: [],
    keyColors,
    timeLeft,
    timerStartTime: localStorage.getItem('timerStartTime')
  };

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    gameState.boardState[r] = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      gameState.boardState[r][c] = {
        text:    board[r][c].innerText,
        classes: board[r][c].className
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
  if (!savedState) {
    resetGame();
    return;
  }

  try {
    const gs = JSON.parse(savedState);

    // Restore row and col exactly as saved
    row      = typeof gs.row === 'number' ? gs.row : 0;
    col      = typeof gs.col === 'number' ? gs.col : 0;
    timeLeft = gs.timeLeft || 60;
    isSubmitting = false;

    // Restore every tile with its full className (preserves all colors)
    if (gs.boardState) {
      for (let r = 0; r < MAX_ATTEMPTS; r++) {
        for (let c = 0; c < WORD_LENGTH; c++) {
          if (gs.boardState[r] && gs.boardState[r][c]) {
            board[r][c].innerText = gs.boardState[r][c].text || "";
            board[r][c].className = gs.boardState[r][c].classes || "tile";
          }
        }
      }
    }

    // Restore keyboard colors
    keyColors = gs.keyColors || {};
    Object.entries(keyColors).forEach(([letter, color]) => {
      const el = document.getElementById("key-" + letter);
      if (el) {
        el.classList.remove("green", "yellow", "gray");
        el.classList.add(color);
      }
    });

    console.log('Restored. Row:', row, 'Col:', col);
  } catch (err) {
    console.error('Restore failed, resetting:', err);
    resetGame();
  }
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
      try {
        await fetch('/api/stats/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, guesses: 0, won: false })
        });
      } catch (err) {
        console.error('Error saving loss stats:', err);
      }

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

function closeWinModal() {
  document.getElementById("win-modal").style.display = "none";
}

function redirectToAuth() {
  window.location.href = "/login";
}