import { applyPixelArt } from "./pixelart.js";
import { PLAYER_DOWN, HEAP_WARDEN, EMBER_SORTER, GATE_ICON, FURNACE_STACK_ICON, PIXEL_SIZE as SPRITE_PX } from "./sprites.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { startTicketBattle, makeTicket } from "./ticketBattle.js";
import { solvePriorityOrder } from "./priorityPolicy.js";

export const TILE = 42;
const COLS = 13;
const ROWS = 10;

// 1 wall, 0 floor, 2 furnace clutter, 3 gate closed, 6 gate open,
// 5 Ember Sorter (minor), 8 secret, 9 Heap Warden boss
const BASE_MAP = [
  [1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1],
  [1, 0, 2, 0, 2, 0, 9, 0, 2, 0, 2, 0, 1],
  [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1],
  [1, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 1],
  [1, 0, 2, 2, 0, 2, 0, 2, 0, 2, 2, 0, 1],
  [1, 0, 8, 0, 0, 2, 0, 2, 0, 0, 0, 0, 1],
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
let onExitToChapter3 = null;

function priorityTicket(id, arrival, priority) {
  return { id, arrival, priority };
}

function randomSealedEmbers(count) {
  const letters = ["A", "B", "C", "D", "E", "F", "G"];
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: count }, (_, i) => priorityTicket(letters[i], i, pool[i]));
}

export function initChapter2Room({ onExitToChapter3: exitHandler } = {}) {
  onExitToChapter3 = exitHandler || null;
  viewport = document.getElementById("room-viewport-ch2");
  viewport.className = "room-viewport theme-heaplight";
  viewport.style.width = `${COLS * TILE}px`;
  viewport.style.height = `${ROWS * TILE}px`;
  viewport.style.transformOrigin = "top center";
  fitViewportToScreen();
  window.removeEventListener("resize", fitViewportToScreen);
  window.addEventListener("resize", fitViewportToScreen);
  map = BASE_MAP.map((row) => row.slice());

  const { heapWardenDefeated, emberSorterCleared } = getState();
  if (emberSorterCleared) {
    map[5][5] = 0;
  }
  if (heapWardenDefeated) {
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
        { speaker: "", text: "Heat rolls off the furnace floor. Every ember here fights to be the one that matters most." },
        { speaker: "Mira Vale", text: "The Heap Warden keeps the worst fires burning first. Show him priority needs rules, not just heat." },
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
        appendIcon(tile, FURNACE_STACK_ICON, false);
      }
      viewport.appendChild(tile);
    }
  }

  if (map[2][6] === 9) placeEntity("warden", 6, 2, HEAP_WARDEN, 5);
  if (map[5][5] === 5) placeEntity("ember", 5, 5, EMBER_SORTER, SPRITE_PX);

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

function placeEntity(id, col, row, sprite, pixelSize) {
  let el = viewport.querySelector(`[data-entity="${id}"]`);
  if (!el) {
    el = document.createElement("div");
    el.className = "entity";
    el.dataset.entity = id;
    viewport.appendChild(el);
    const inner = document.createElement("div");
    applyPixelArt(inner, sprite.matrix, sprite.palette, pixelSize);
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

  if (code === 5) return enterEmberSorterBattle();
  if (code === 9) return enterHeapWardenBattle();
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

const PRIORITY_BATTLE_TEXT = {
  roundHint1: "Click embers in the order the Foundry should burn them: highest priority first.",
  roundHint2: "The Foundry banked a fresh set of embers. Prove the rule still holds.",
  wrongPublicHint: "Not quite. Highest priority goes first; equal priority keeps arrival order.",
  wrongSealedHint: "The visible order held, but a fresh bank of embers exposed a guess.",
  wonPublicHint: "That holds. But can it survive a fresh bank of embers?",
  wonHint: "Priority confirmed. The heap holds its shape.",
  incompletePickHint: "Every ember needs a place in the burn order.",
  flagLabel: (t) => `P${t.priority}`,
  flagClass: (t) => t.priority >= 7,
  solve: solvePriorityOrder,
  generateSealed: randomSealedEmbers,
};

function enterEmberSorterBattle() {
  sayLines(
    [{ speaker: "", text: "An Ember Sorter spins loose, burning whatever it grabs first instead of what matters most." }],
    () => {
      startTicketBattle({
        title: "Ember Sorter",
        publicTickets: [
          priorityTicket("A", 0, 3),
          priorityTicket("B", 1, 7),
          priorityTicket("C", 2, 5),
        ],
        sealedCount: 3,
        enemySprite: EMBER_SORTER,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch2",
        ...PRIORITY_BATTLE_TEXT,
        onWin: () => {
          setState({ emberSorterCleared: true });
          map[5][5] = 0;
          render();
          sayLines([
            { speaker: "Mira Vale", text: "Good. The floor cools where it should." },
            { speaker: "", text: "The furnace stack lowers its brightest ember into place instead of thrashing for attention." },
          ]);
        },
      });
    }
  );
}

function enterHeapWardenBattle() {
  const { heapWardenDefeated } = getState();
  if (heapWardenDefeated) {
    sayLines([{ speaker: "The Heap Warden", text: "The hottest fire still rises first. As it should." }]);
    return;
  }
  sayLines(
    [
      { speaker: "The Heap Warden", text: "Crisis has one shape: the worst fire, first. Nothing else matters." },
      { speaker: "The Heap Warden", text: "Prove your rule survives more than one furnace." },
    ],
    () => {
      startTicketBattle({
        title: "The Heap Warden",
        publicTickets: [
          priorityTicket("A", 0, 4),
          priorityTicket("B", 1, 9),
          priorityTicket("C", 2, 4),
          priorityTicket("D", 3, 7),
          priorityTicket("E", 4, 1),
        ],
        sealedCount: 5,
        enemySprite: HEAP_WARDEN,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch2",
        ...PRIORITY_BATTLE_TEXT,
        onWin: () => {
          setState({ heapWardenDefeated: true });
          map[2][6] = 0;
          map[0][6] = 6;
          map[0][7] = 6;
          render();
          sayLines([
            { speaker: "The Heap Warden", text: "...Equal fires can wait their turn fairly. I hadn't proven that before." },
            { speaker: "", text: "The furnace floor settles into a steady, legible heat. Priority becomes a tool again, not a throne." },
          ]);
        },
      });
    }
  );
}

function findSecret() {
  const { foundHeaplightSecret } = getState();
  if (foundHeaplightSecret) {
    sayLines([{ speaker: "", text: "The cooled vent is already open. Just old ash now." }]);
    return;
  }
  setState({ foundHeaplightSecret: true });
  sayLines([
    { speaker: "", text: "A cooled vent shaft, easy to miss between the furnace stacks." },
    { speaker: "", text: "Old tags inside show forged priority stamps: someone was manipulating whose fire burned first." },
    { speaker: "Mira Vale", text: "Importance is only as honest as whoever assigns it. Worth remembering." },
  ]);
}

function onReachOpenGate() {
  if (hasWarnedGateOnce) return;
  hasWarnedGateOnce = true;
  sayLines(
    [
      { speaker: "", text: "The vent shaft leads up, out past the furnace floor into open, restless ground." },
      { speaker: "Mira Vale", text: "That's the Array Plains. Watch your footing - the formations shift out there." },
    ],
    () => {
      if (onExitToChapter3) onExitToChapter3();
    }
  );
}

function bindInput() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);

  const dpad = document.getElementById("dpad-ch2");
  dpad.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => handleDirAction(btn.dataset.dir);
  });
}

function handleDirAction(dir) {
  if (document.getElementById("screen-room-ch2").classList.contains("active") === false) return;
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
  if (code === 5) enterEmberSorterBattle();
  else if (code === 9) enterHeapWardenBattle();
  else if (code === 8) findSecret();
  else if (code === 6) onReachOpenGate();
}

function onKeyDown(e) {
  if (document.getElementById("screen-room-ch2").classList.contains("active") === false) return;
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
