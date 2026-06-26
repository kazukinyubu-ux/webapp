import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const BOARD_SIZE = 5;
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
const ROOM_ID = new URLSearchParams(window.location.search).get("room") || "main";

const boardEl = document.getElementById("board");
const bingoMessageEl = document.getElementById("bingoMessage");
const syncStatusEl = document.getElementById("syncStatus");
const roomIdEl = document.getElementById("roomId");
const copyLinkBtn = document.getElementById("copyLinkBtn");

if (!window.firebaseConfig) {
  throw new Error("firebase.js に firebaseConfig がありません");
}

if (!Array.isArray(window.TASKS)) {
  throw new Error("tasks.js の TASKS が見つかりません");
}

if (window.TASKS.length !== CELL_COUNT) {
  throw new Error(`TASKSは${CELL_COUNT}個必要です`);
}

const firebaseApp = initializeApp(window.firebaseConfig);
const db = getFirestore(firebaseApp);
const roomRef = doc(db, "rooms", ROOM_ID);

roomIdEl.textContent = ROOM_ID;

let cells = Array(CELL_COUNT).fill(false);
let bingoCount = 0;
let unsub = null;
let isReady = false;

function countBingos(state) {
  const lines = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const line = [];
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      line.push(row * BOARD_SIZE + col);
    }
    lines.push(line);
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const line = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      line.push(row * BOARD_SIZE + col);
    }
    lines.push(line);
  }

  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);

  return lines.filter((line) => line.every((index) => state[index])).length;
}

function renderBingoMessage() {
  bingoMessageEl.textContent = bingoCount > 0 ? `BINGO${"!".repeat(bingoCount)}` : "";
}

function renderSyncStatus(message) {
  syncStatusEl.textContent = message;
}

function renderBoard() {
  boardEl.innerHTML = "";

  window.TASKS.forEach((task, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cell${cells[index] ? " completed" : ""}`;
    button.textContent = task;
    button.setAttribute("aria-pressed", String(cells[index]));
    button.addEventListener("click", () => updateCell(index));
    boardEl.appendChild(button);
  });
}

async function updateCell(index) {
  if (!isReady) return;

  const nextCells = [...cells];
  nextCells[index] = !nextCells[index];

  await setDoc(
    roomRef,
    {
      cells: nextCells,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

async function initRealtimeSync() {
  renderSyncStatus("Firebase接続中…");

  unsub = onSnapshot(roomRef, async (snapshot) => {
    if (!snapshot.exists()) {
      await setDoc(roomRef, {
        cells: Array(CELL_COUNT).fill(false),
        updatedAt: Date.now(),
      });
      return;
    }

    const data = snapshot.data();
    cells = Array.isArray(data.cells) && data.cells.length === CELL_COUNT
      ? data.cells
      : Array(CELL_COUNT).fill(false);

    bingoCount = countBingos(cells);
    renderBoard();
    renderBingoMessage();
    renderSyncStatus("Firebase同期中");
    isReady = true;
  }, (error) => {
    console.error(error);
    renderSyncStatus("Firebase接続エラー");
  });
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(
      `${location.origin}${location.pathname}?room=${encodeURIComponent(ROOM_ID)}`
    );
    copyLinkBtn.textContent = "コピーしました";
    setTimeout(() => {
      copyLinkBtn.textContent = "URLをコピー";
    }, 1500);
  } catch {
    copyLinkBtn.textContent = "コピー失敗";
    setTimeout(() => {
      copyLinkBtn.textContent = "URLをコピー";
    }, 1500);
  }
}

copyLinkBtn.addEventListener("click", copyShareLink);

renderBoard();
renderBingoMessage();
initRealtimeSync();