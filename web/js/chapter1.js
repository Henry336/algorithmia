import { applyPixelArt } from "./pixelart.js";
import { PLAYER_DOWN, DISPATCHER, LINE_CUTTER, GATE_ICON, QUEUE_RAIL_ICON, PIXEL_SIZE as SPRITE_PX } from "./sprites.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { startTicketBattle, makeTicket } from "./ticketBattle.js";
import { solveTriageOrder } from "./triagePolicy.js";

export const TILE = 42;
const COLS = 13;
const ROWS = 10;

// 1 wall, 0 floor, 2 counter clutter, 3 gate closed, 6 gate open,
// 5 line cutter (minor), 8 secret, 9 Dispatcher boss
const BASE_MAP = [
  [1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const PLAYER_START = { col: 6, row: 8 };

let viewport;
let map;
let player = { ...PLAYER_START, facing: "up" };
let playerEl;
let hasGreeted = false;
let hasWarnedGateOnce = false;
let onExitToChapter2 = null;

export function initChapter1Room({ onExitToChapter2: exitHandler } = {}) {
  onExitToChapter2 = exitHandler || null;
  viewport = document.getElementById("room-viewport-ch1");
  viewport.className = "room-viewport theme-dispatch";
  viewport.style.width = `${COLS * TILE}px`;
  viewport.style.height = `${ROWS * TILE}px`;
  viewport.style.transformOrigin = "top center";
  fitViewportToScreen();
  window.removeEventListener("resize", fitViewportToScreen);
  window.addEventListener("resize", fitViewportToScreen);
  map = BASE_MAP.map((row) => row.slice());

  const { dispatcherDefeated, lineCutterCleared } = getState();
  if (lineCutterCleared) {
    map[5][5] = 0;
  }
  if (dispatcherDefeated) {
    map[2][6] = 0;
    map[0][6] = 6;
    map[0][7] = 6;
  }

  player = { ...PLAYER_START, facing: "up" };
  render();
  bindInput();

  if (!hasGreeted) {
    hasGreeted = true;
    window.setTimeout(() => {
      sayLines([
        { speaker: "", text: "The dispatch hall stretches ahead, counters humming with stalled tickets." },
        { speaker: "Mira Vale", text: "The Dispatcher runs this line. Clear what's blocking it and he'll talk." },
      ]);
    }, 250);
  }
}

function fitViewportToScreen() {
  const naturalWidth = COLS * TILE;
  const available = window.innerWidth - 24;
  const scale = Math.min(1, available / naturalWidth);
  viewport.style.transform = scale < 1 ? `scale(${scale})` : "";
}

function render() {
  viewport.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const code = map[r][c];
      const tile = document.createElement("div");
      tile.className = "tile " + tileClass(code, r, c);
      tile.style.left = `${c * TILE}px`;
      tile.style.top = `${r * TILE}px`;
      tile.style.width = `${TILE}px`;
      tile.style.height = `${TILE}px`;
      if (code === 3 || code === 6) {
        appendIcon(tile, GATE_ICON, code === 6);
      } else if (code === 2) {
        appendIcon(tile, QUEUE_RAIL_ICON, false);
      }
      viewport.appendChild(tile);
    }
  }

  if (map[2][6] === 9) placeEntity("dispatcher", 6, 2, DISPATCHER, 5);
  if (map[5][5] === 5) placeEntity("cutter", 5, 5, LINE_CUTTER, SPRITE_PX);

  playerEl = placeEntity("player", player.col, player.row, PLAYER_DOWN, SPRITE_PX);
}

function tileClass(code, r, c) {
  if (code === 1) return "tile-wall";
  if (code === 3) return "tile-gate";
  if (code === 6) return "tile-gate open";
  if (code === 2) return "tile-ledger";
  return "tile-floor" + ((r + c) % 2 === 0 ? "" : " alt");
}

function appendIcon(tile, sprite, muted) {
  const wrap = document.createElement("div");
  wrap.className = "tile-icon-wrap";
  const el = document.createElement("div");
  applyPixelArt(el, sprite.matrix, sprite.palette, 3);
  if (muted) el.style.opacity = "0.35";
  wrap.appendChild(el);
  tile.appendChild(wrap);
}

function placeEntity(id, col, row, sprite, pixelSize, opacity) {
  let el = viewport.querySelector(`[data-entity="${id}"]`);
  if (!el) {
    el = document.createElement("div");
    el.className = "entity";
    el.dataset.entity = id;
    viewport.appendChild(el);
    const inner = document.createElement("div");
    applyPixelArt(inner, sprite.matrix, sprite.palette, pixelSize);
    if (opacity !== undefined) inner.style.opacity = String(opacity);
    el.appendChild(inner);
  }
  el.style.width = `${TILE}px`;
  el.style.height = `${TILE}px`;
  el.style.left = `${col * TILE}px`;
  el.style.top = `${row * TILE}px`;
  return el;
}

function tileAt(col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 1;
  return map[row][col];
}

function isBlocking(code) {
  return code === 1 || code === 2 || code === 3 || code === 5 || code === 8 || code === 9;
}

const DIR_OFFSET = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

function tryMove(dir) {
  if (isDialogueActive()) return;
  player.facing = dir;
  const { dc, dr } = DIR_OFFSET[dir];
  const targetCol = player.col + dc;
  const targetRow = player.row + dr;
  const code = tileAt(targetCol, targetRow);

  if (code === 5) return enterLineCutterBattle();
  if (code === 9) return enterDispatcherBattle();
  if (code === 8) return findSecret();
  if (code === 6) return onReachOpenGate();
  if (isBlocking(code)) return;

  player.col = targetCol;
  player.row = targetRow;
  if (playerEl) {
    playerEl.style.left = `${player.col * TILE}px`;
    playerEl.style.top = `${player.row * TILE}px`;
  }
}

function enterLineCutterBattle() {
  sayLines(
    [{ speaker: "", text: "A Line Cutter jumps the queue, clutching a stolen ticket." }],
    () => {
      startTicketBattle({
        title: "Line Cutter",
        publicTickets: [makeTicket("A", 0, false), makeTicket("B", 1, true), makeTicket("C", 2, false)],
        sealedCount: 3,
        solve: solveTriageOrder,
        enemySprite: LINE_CUTTER,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch1",
        onWin: () => {
          setState({ lineCutterCleared: true });
          map[5][5] = 0;
          render();
          sayLines([
            { speaker: "Mira Vale", text: "The line moves again. One less snag." },
            { speaker: "", text: "The ticket rails pulse in arrival order, then let urgency pass without breaking the line." },
          ]);
        },
      });
    }
  );
}

function enterDispatcherBattle() {
  const { dispatcherDefeated } = getState();
  if (dispatcherDefeated) {
    sayLines([{ speaker: "The Dispatcher", text: "The line holds. For now." }]);
    return;
  }
  sayLines(
    [
      { speaker: "The Dispatcher", text: "Order is order. I will not break the line again." },
      { speaker: "The Dispatcher", text: "Prove your policy. Serve them right." },
    ],
    () => {
      startTicketBattle({
        title: "The Dispatcher",
        publicTickets: [
          makeTicket("A", 0, false),
          makeTicket("B", 1, true),
          makeTicket("C", 2, true),
          makeTicket("D", 3, true),
          makeTicket("E", 4, false),
        ],
        sealedCount: 5,
        solve: solveTriageOrder,
        enemySprite: DISPATCHER,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch1",
        onWin: () => {
          setState({ dispatcherDefeated: true });
          map[2][6] = 0;
          map[0][6] = 6;
          map[0][7] = 6;
          render();
          sayLines([
            { speaker: "The Dispatcher", text: "...Urgent doesn't have to mean forgotten. I see that now." },
            { speaker: "", text: "The counter strip clears. The line moves on its own, urgent lights woven back into ordinary service." },
          ]);
        },
      });
    }
  );
}

function findSecret() {
  const { foundDispatcherSecret } = getState();
  if (foundDispatcherSecret) {
    sayLines([{ speaker: "", text: "The sealed hatch is already open. Just old paper now." }]);
    return;
  }
  setState({ foundDispatcherSecret: true });
  sayLines([
    { speaker: "", text: "A sealed hatch, hidden behind loose paneling." },
    { speaker: "", text: "Inside: manifests for emergency routes, deliberately sealed after something called the Cascade." },
    { speaker: "Mira Vale", text: "Someone didn't want these found. Worth remembering." },
  ]);
}

function onReachOpenGate() {
  if (hasWarnedGateOnce) return;
  hasWarnedGateOnce = true;
  sayLines(
    [
      { speaker: "", text: "The line leads up into a wall of heat: the Heaplight Foundry." },
      { speaker: "Mira Vale", text: "Careful in there. Everything fights to matter most." },
    ],
    () => {
      if (onExitToChapter2) onExitToChapter2();
    }
  );
}

function bindInput() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);

  const dpad = document.getElementById("dpad-ch1");
  dpad.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => handleDirAction(btn.dataset.dir);
  });
}

function handleDirAction(dir) {
  if (document.getElementById("screen-room-ch1").classList.contains("active") === false) return;
  if (dir === "interact") {
    if (isDialogueActive()) {
      advanceDialogue();
    } else {
      interactFacing();
    }
    return;
  }
  if (isDialogueActive()) return;
  tryMove(dir);
}

function interactFacing() {
  if (isDialogueActive()) return;
  const { dc, dr } = DIR_OFFSET[player.facing];
  const code = tileAt(player.col + dc, player.row + dr);
  if (code === 5) enterLineCutterBattle();
  else if (code === 9) enterDispatcherBattle();
  else if (code === 8) findSecret();
  else if (code === 6) onReachOpenGate();
}

function onKeyDown(e) {
  if (document.getElementById("screen-room-ch1").classList.contains("active") === false) return;
  const key = e.code;
  const keyDirs = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  };
  if (keyDirs[key]) {
    e.preventDefault();
    if (isDialogueActive()) return;
    tryMove(keyDirs[key]);
    return;
  }
  if (key === "Space" || key === "Enter") {
    e.preventDefault();
    if (isDialogueActive()) {
      advanceDialogue();
      return;
    }
    interactFacing();
  }
}
