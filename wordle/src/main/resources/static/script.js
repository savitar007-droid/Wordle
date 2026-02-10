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
    console.log('Resuming game in', savedMode, 'mode');
    startGame(savedMode);
  } else {
    disableGameInput();
  }

  document.addEventListener("keydown", onKey);
  checkLoginStatus();
});

/* ---------- CHECK GAME ACCESS ---------- */
function checkGameAccess() {
  const currentUser = localStorage.getItem('user');

  if (!currentUser) {
    alert('Please login to play!');
    window.location.replace('/');
    return;
  }

  history.pushState(null, null, location.href);
  window.onpopstate = function() {
    const user = localStorage.getItem('user');
    if (!user) {
      window.location.replace('/');
    } else {
      history.pushState(null, null, location.href);
    }
  };

  window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
      const user = localStorage.getItem('user');
      if (!user) {
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
  gameMode = mode;
  gameOver = false;

  const isResuming = localStorage.getItem('gameInProgress') === 'true';
  if (!isResuming) {
    resetGame();
  } else {
    restoreGameState();
  }

  document.getElementById("mode-modal").style.display = "none";
  enableGameInput();

  if (mode === "time") {
    startTimer();
  } else {
    clearTimer();
  }
}

function openModeModal() {
  if (!gameOver) {
    showToast("Can't change mode during an active game");
    return;
  }
  document.getElementById("mode-modal").style.display = "flex";
}

/* ---------- INPUT ENABLE/DISABLE ---------- */
function disableGameInput() {
  board.forEach(r => r.forEach(t => t.style.pointerEvents = "none"));
  document.getElementById("keyboard").style.pointerEvents = "none";
}

function enableGameInput() {
  board.forEach(r => r.forEach(t => t.style.pointerEvents = "auto"));
  document.getElementById("keyboard").style.pointerEvents = "auto";
}

/* ---------- RESET ---------- */
function resetGame() {
  row = 0;
  col = 0;
  gameOver = false;

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      board[r][c].innerText = "";
      board[r][c].className = "tile";
    }
  }

  document.querySelectorAll(".key")
    .forEach(k => k.classList.remove("green","yellow","gray"));
}

/* ---------- TIMER ---------- */
function startTimer() {
  const savedStartTime = localStorage.getItem('timerStartTime');
  const now = Date.now();

  if (savedStartTime) {
    const elapsed = Math.floor((now - parseInt(savedStartTime)) / 1000);
    timeLeft = Math.max(0, 60 - elapsed);

    console.log('Resuming timer. Elapsed:', elapsed, 'Time left:', timeLeft);

    if (timeLeft <= 0) {
      endGame("⏰ Time's up!");
      return;
    }
  } else {
    timeLeft = 60;
    localStorage.setItem('timerStartTime', now.toString());
    console.log('Starting new timer at', now);
  }

  updateTimer();

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    localStorage.setItem('timeLeft', timeLeft.toString());

    if (timeLeft <= 0) {
      endGame("⏰ Time's up!");
    }
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

  layout.forEach((r,i) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "keyboard-row";
    if (i === 1) rowDiv.style.marginLeft = "18px";

    r.forEach(k => {
      const key = document.createElement("div");
      key.className = "key";
      if (k === "ENTER" || k === "⌫") key.classList.add("wide");
      key.innerText = k;
      key.onclick = () => handle(k);
      rowDiv.appendChild(key);
    });

    kb.appendChild(rowDiv);
  });
}

/* ---------- INPUT ---------- */
function onKey(e) {
  if (gameOver || !gameMode) return;
  if (e.key === "Enter") handle("ENTER");
  else if (e.key === "Backspace") handle("⌫");
  else if (/^[A-Za-z]$/.test(e.key)) handle(e.key.toUpperCase());
}

function handle(k) {
  if (gameOver) return;
  if (k === "ENTER") submit();
  else if (k === "⌫") back();
  else add(k);
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

  const guess = board[row].map(t => t.innerText).join("");

  if (!isValidWord(guess)) {
    showInvalidWord();
    return;
  }

  const res = await fetch("/api/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guess })
  });

  if (!res.ok) {
    showInvalidWord();
    return;
  }

  const result = (await res.json()).split("");
  let correct = true;

  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = board[row][i];
    tile.classList.add('flip');

    setTimeout(() => {
      const status =
        result[i] === "G" ? "green" :
        result[i] === "Y" ? "yellow" : "gray";

      tile.classList.add(status);
      if (result[i] !== "G") correct = false;
    }, i * 100 + 250);
  }

  await new Promise(resolve => setTimeout(resolve, 600));

  saveGameState();

  if (correct) {
    handleWin(row + 1);
    endGame("");
    clearGameState();
    return;
  }

  if (gameMode === "sudden") {
    endGame("💀 Sudden Death! One wrong guess.");
    clearGameState();
    return;
  }

  row++;
  col = 0;

  if (row === MAX_ATTEMPTS) {
    endGame("Game Over");
    clearGameState();
  }
}

/* ---------- WORD VALIDATION ---------- */
function isValidWord(word) {
  const validWords = [
    "HELLO", "WORLD", "CRANE", "SLATE", "ADIEU", "STARE", "TRAIN",
    "BREAK", "LIGHT", "PRIZE", "ABOUT", "ABOVE", "ACTOR", "ACUTE",
    "ADMIT", "ADOPT", "ADULT", "AFTER", "AGAIN", "AGENT", "AGREE",
    "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIGN", "ALIKE", "ALIVE",
    "ALLOW", "ALONE", "ALONG", "ALTER", "AMBER", "AMEND", "ANGEL",
    "ANGER", "ANGLE", "ANGRY", "APART", "APPLE", "APPLY", "ARENA",
    "ARGUE", "ARISE", "ARRAY", "ARROW", "ASIDE", "ASSET", "AUDIO",
    "AUDIT", "AVOID", "AWARD", "AWARE", "BADLY", "BAKER", "BASES",
    "BASIC", "BASIN", "BASIS", "BEACH", "BEGAN", "BEGIN", "BEGUN",
    "BEING", "BELOW", "BENCH", "BILLY", "BIRTH", "BLACK", "BLADE",
    "BLAME", "BLANK", "BLAST", "BLEED", "BLESS", "BLIND", "BLOCK",
    "BLOOD", "BLOOM", "BLOWN", "BLUES", "BOARD", "BOOST", "BOOTH",
    "BOUND", "BRAIN", "BRAND", "BRASS", "BRAVE", "BREAD", "BREED",
    "BRIEF", "BRING", "BROAD", "BROKE", "BROWN", "BUILD", "BUILT",
    "BUYER", "CABLE", "CALIF", "CARRY", "CATCH", "CAUSE", "CHAIN",
    "CHAIR", "CHAOS", "CHARM", "CHART", "CHASE", "CHEAP", "CHECK",
    "CHESS", "CHEST", "CHIEF", "CHILD", "CHINA", "CHOSE", "CIVIL",
    "CLAIM", "CLASS", "CLEAN", "CLEAR", "CLICK", "CLIFF", "CLIMB",
    "CLOCK", "CLOSE", "CLOTH", "CLOUD", "COACH", "COAST", "COULD",
    "COUNT", "COURT", "COVER", "CRACK", "CRAFT", "CRASH", "CRAZY",
    "CREAM", "CRIME", "CROSS", "CROWD", "CROWN", "CRUDE", "CURVE",
    "CYCLE", "DAILY", "DANCE", "DATED", "DEALT", "DEATH", "DEBUT",
    "DELAY", "DELTA", "DENSE", "DEPOT", "DEPTH", "DOING", "DOUBT",
    "DOZEN", "DRAFT", "DRAMA", "DRANK", "DRAWN", "DREAM", "DRESS",
    "DRILL", "DRINK", "DRIVE", "DROVE", "DYING", "EAGER", "EARLY",
    "EARTH", "EIGHT", "ELITE", "EMPTY", "ENEMY", "ENJOY", "ENTER",
    "ENTRY", "EQUAL", "ERROR", "EVENT", "EVERY", "EXACT", "EXIST",
    "EXTRA", "FAITH", "FALSE", "FAULT", "FIBER", "FIELD", "FIFTH",
    "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED", "FLASH", "FLEET",
    "FLOOR", "FLUID", "FOCUS", "FORCE", "FORTH", "FORTY", "FORUM",
    "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRONT", "FRUIT",
    "FULLY", "FUNNY", "GIANT", "GIVEN", "GLASS", "GLOBE", "GOING",
    "GRACE", "GRADE", "GRAND", "GRANT", "GRASS", "GRAVE", "GREAT",
    "GREEN", "GROSS", "GROUP", "GROWN", "GUARD", "GUESS", "GUEST",
    "GUIDE", "HAPPY", "HARRY", "HEART", "HEAVY", "HENCE", "HENRY",
    "HORSE", "HOTEL", "HOUSE", "HUMAN", "IDEAL", "IMAGE", "INDEX",
    "INNER", "INPUT", "ISSUE", "JIMMY", "JOINT", "JONES", "JUDGE",
    "KNOWN", "LABEL", "LARGE", "LASER", "LATER", "LAUGH", "LAYER",
    "LEARN", "LEASE", "LEAST", "LEAVE", "LEGAL", "LEMON", "LEVEL",
    "LEWIS", "LIGHT", "LIMIT", "LINKS", "LIVES", "LOCAL", "LOGIC",
    "LOOSE", "LOWER", "LUCKY", "LUNCH", "LYING", "MAGIC", "MAJOR",
    "MAKER", "MARCH", "MARIA", "MATCH", "MAYBE", "MAYOR", "MEANT",
    "MEDIA", "METAL", "MIGHT", "MINOR", "MINUS", "MIXED", "MODEL",
    "MONEY", "MONTH", "MORAL", "MOTOR", "MOUNT", "MOUSE", "MOUTH",
    "MOVIE", "MUSIC", "NEEDS", "NEVER", "NEWLY", "NIGHT", "NOISE",
    "NORTH", "NOTED", "NOVEL", "NURSE", "OCCUR", "OCEAN", "OFFER",
    "OFTEN", "ORDER", "OTHER", "OUGHT", "PAINT", "PANEL", "PAPER",
    "PARTY", "PEACE", "PETER", "PHASE", "PHONE", "PHOTO", "PIECE",
    "PILOT", "PITCH", "PLACE", "PLAIN", "PLANE", "PLANT", "PLATE",
    "POINT", "POUND", "POWER", "PRESS", "PRICE", "PRIDE", "PRIME",
    "PRINT", "PRIOR", "PROOF", "PROUD", "PROVE", "QUEEN", "QUICK",
    "QUIET", "QUITE", "RADIO", "RAISE", "RANGE", "RAPID", "RATIO",
    "REACH", "READY", "REFER", "RIGHT", "RIVAL", "RIVER", "ROGER",
    "ROMAN", "ROUGH", "ROUND", "ROUTE", "ROYAL", "RURAL", "SCALE",
    "SCENE", "SCOPE", "SCORE", "SENSE", "SERVE", "SEVEN", "SHALL",
    "SHAPE", "SHARE", "SHARP", "SHEET", "SHELF", "SHELL", "SHIFT",
    "SHINE", "SHIRT", "SHOCK", "SHOOT", "SHORT", "SHOWN", "SIGHT",
    "SINCE", "SIXTH", "SIZED", "SKILL", "SLEEP", "SLIDE", "SMALL",
    "SMART", "SMILE", "SMITH", "SMOKE", "SOLID", "SOLVE", "SORRY",
    "SOUND", "SOUTH", "SPACE", "SPARE", "SPEAK", "SPEED", "SPEND",
    "SPENT", "SPLIT", "SPOKE", "SPORT", "STAFF", "STAGE", "STAKE",
    "STAND", "START", "STATE", "STEAM", "STEEL", "STICK", "STILL",
    "STOCK", "STONE", "STOOD", "STORE", "STORM", "STORY", "STRIP",
    "STUCK", "STUDY", "STUFF", "STYLE", "SUGAR", "SUITE", "SUPER",
    "SWEET", "TABLE", "TAKEN", "TASTE", "TAXES", "TEACH", "TERRY",
    "TEXAS", "THANK", "THEFT", "THEIR", "THEME", "THERE", "THESE",
    "THICK", "THING", "THINK", "THIRD", "THOSE", "THREE", "THREW",
    "THROW", "TIGHT", "TIMES", "TITLE", "TODAY", "TOPIC", "TOTAL",
    "TOUCH", "TOUGH", "TOWER", "TRACK", "TRADE", "TREND", "TRIAL",
    "TRIBE", "TRICK", "TRIED", "TROOP", "TRUCK", "TRULY", "TRUNK",
    "TRUST", "TRUTH", "TWICE", "UNDER", "UNDUE", "UNION", "UNITY",
    "UNTIL", "UPPER", "UPSET", "URBAN", "USAGE", "USUAL", "VALID",
    "VALUE", "VIDEO", "VIRUS", "VISIT", "VITAL", "VOCAL", "VOICE",
    "WASTE", "WATCH", "WATER", "WHEEL", "WHERE", "WHICH", "WHILE",
    "WHITE", "WHOLE", "WHOSE", "WOMAN", "WOMEN", "WORTH", "WOULD",
    "WOUND", "WRITE", "WRONG", "WROTE", "YIELD", "YOUNG", "YOURS",
    "YOUTH"
  ];

  return validWords.includes(word.toUpperCase());
}

/* ---------- SHOW INVALID WORD ---------- */
function showInvalidWord() {
  const rowElement = board[row][0].parentElement;
  rowElement.classList.add('shake');
  showToast("Word not in list");

  setTimeout(() => {
    rowElement.classList.remove('shake');
  }, 500);
}

/* ---------- HANDLE WIN ---------- */
function handleWin(attempts) {
  const winMessage = WIN_MESSAGES[attempts - 1];
  showToast("🎉 " + winMessage + " 🎉");

  currentUser = localStorage.getItem('user');
  console.log('User on win:', currentUser);

  if (currentUser) {
    console.log('Updating stats for user:', currentUser);
    updateUserStats(attempts);
    setTimeout(() => {
      window.location.href = '/statistics';
    }, 2500);
  } else {
    setTimeout(() => {
      showWinModal(winMessage);
    }, 2000);
  }
}

/* ---------- UPDATE USER STATS ---------- */
function updateUserStats(attempts) {
  const statsKey = 'wordleStats_' + currentUser;
  let stats = JSON.parse(localStorage.getItem(statsKey) || '{"played": 0, "won": 0, "currentStreak": 0, "maxStreak": 0, "distribution": [0,0,0,0,0,0], "lastWin": null}');

  console.log('Before update:', stats);

  stats.played++;
  stats.won++;
  stats.currentStreak++;
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  stats.distribution[attempts - 1]++;
  stats.lastWin = attempts;

  console.log('After update:', stats);
  console.log('Saving to:', statsKey);

  localStorage.setItem(statsKey, JSON.stringify(stats));

  const saved = localStorage.getItem(statsKey);
  console.log('Verified saved:', saved);
}

/* ---------- SAVE GAME STATE ---------- */
function saveGameState() {
  if (!gameMode) return;

  const gameState = {
    mode: gameMode,
    row: row,
    col: col,
    boardState: [],
    timeLeft: timeLeft,
    timerStartTime: localStorage.getItem('timerStartTime')
  };

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    gameState.boardState[r] = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      gameState.boardState[r][c] = {
        text: board[r][c].innerText,
        classes: board[r][c].className
      };
    }
  }

  localStorage.setItem('currentGameMode', gameMode);
  localStorage.setItem('gameInProgress', 'true');
  localStorage.setItem('gameState', JSON.stringify(gameState));
  localStorage.setItem('timeLeft', timeLeft.toString());

  console.log('Game state saved:', gameState);
}

/* ---------- RESTORE GAME STATE ---------- */
function restoreGameState() {
  const savedState = localStorage.getItem('gameState');
  if (!savedState) return;

  try {
    const gameState = JSON.parse(savedState);

    row = gameState.row || 0;
    col = gameState.col || 0;
    timeLeft = gameState.timeLeft || 60;

    if (gameState.boardState) {
      for (let r = 0; r < MAX_ATTEMPTS; r++) {
        for (let c = 0; c < WORD_LENGTH; c++) {
          if (gameState.boardState[r] && gameState.boardState[r][c]) {
            board[r][c].innerText = gameState.boardState[r][c].text;
            board[r][c].className = gameState.boardState[r][c].classes;
          }
        }
      }
    }

    console.log('Game state restored:', gameState);
  } catch (error) {
    console.error('Error restoring game state:', error);
  }
}

/* ---------- CLEAR GAME STATE ---------- */
function clearGameState() {
  localStorage.removeItem('gameInProgress');
  localStorage.removeItem('gameState');
  localStorage.removeItem('currentGameMode');
  localStorage.removeItem('timeLeft');
  localStorage.removeItem('timerStartTime');
  console.log('Game state cleared');
}

/* ---------- END GAME ---------- */
function endGame(msg) {
  gameOver = true;
  clearTimer();
  disableGameInput();

  if (msg && msg.length > 0) {
    showToast(msg);

    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      setTimeout(() => {
        window.location.href = '/loss';
      }, 2000);
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

  console.log("Toast showing:", msg);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.classList.remove("show");
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
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